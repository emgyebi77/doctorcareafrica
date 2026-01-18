import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  AuditAction,
  AuthSessionStatus,
  OtpChannel,
  OtpPurpose,
  RoleType,
  User,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { AUTH_CONFIG } from './auth.constants';
import { AuthTokens } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

interface AuthRequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

type UserWithProfiles = User & {
  patient?: { id: string } | null;
  doctor?: { id: string } | null;
  admin?: { id: string } | null;
};

type RefreshTokenWithUser = {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  user: UserWithProfiles;
  sessionId: string | null;
  session?: {
    id: string;
    status: AuthSessionStatus;
    revokedAt: Date | null;
  } | null;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, meta: AuthRequestMeta) {
    const role = dto.role ?? RoleType.PATIENT;
    if (role === RoleType.ADMIN || role === RoleType.SUPER_ADMIN || role === RoleType.SUPPORT) {
      throw new BadRequestException('Role not allowed for self-registration.');
    }

    const orConditions = [{ email: dto.email }];
    if (dto.phone) {
      orConditions.push({ phone: dto.phone });
    }

    const existing = await this.prisma.user.findFirst({
      where: { OR: orConditions, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('User already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const { user, profileIds } = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role,
          countryId: dto.countryId,
          regionId: dto.regionId,
          cityId: dto.cityId,
          timezone: dto.timezone,
          locale: dto.locale,
        },
      });

      if (role === RoleType.DOCTOR) {
        const doctor = await tx.doctor.create({
          data: {
            userId: user.id,
            countryId: dto.countryId,
            regionId: dto.regionId,
            cityId: dto.cityId,
            licenseNumber: dto.doctorProfile?.licenseNumber,
            specialty: dto.doctorProfile?.specialty,
            yearsExperience: dto.doctorProfile?.yearsExperience,
            bio: dto.doctorProfile?.bio,
          },
        });
        return { user, profileIds: { doctorId: doctor.id } };
      }

      const patient = await tx.patient.create({
        data: {
          userId: user.id,
          countryId: dto.countryId,
          regionId: dto.regionId,
          cityId: dto.cityId,
        },
      });
      return { user, profileIds: { patientId: patient.id } };
    });

    const session = await this.createSession(user, meta);
    const tokens = await this.issueTokens(user, profileIds, meta, session.id);
    this.logger.log(`User registered: ${user.id}`);
    await this.logAudit({
      action: AuditAction.CREATE,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'User',
      entityId: user.id,
      description: 'User self-registered.',
      meta,
    });
    return {
      user: this.publicUser(user, profileIds),
      tokens,
    };
  }

  async requestOtp(dto: OtpRequestDto, meta: AuthRequestMeta) {
    const user = await this.findUserByIdentifier(dto.identifier);
    if (!user) {
      return { success: true };
    }

    if (user.status !== UserStatus.ACTIVE) {
      return { success: true };
    }

    const destination =
      dto.channel === OtpChannel.SMS ? user.phone : dto.channel === OtpChannel.EMAIL ? user.email : null;
    if (!destination) {
      throw new BadRequestException('Requested channel is not available for this user.');
    }

    const code = this.generateOtpCode(this.otpLength);
    const codeHash = this.hashOtpCode(code);
    const expiresAt = this.addMinutes(new Date(), this.otpTtlMinutes);
    const challenge = await this.prisma.otpChallenge.create({
      data: {
        userId: user.id,
        countryId: user.countryId,
        channel: dto.channel,
        purpose: OtpPurpose.LOGIN,
        destination,
        codeHash,
        expiresAt,
        maxAttempts: this.otpMaxAttempts,
      },
    });

    this.logger.log(`OTP requested for user: ${user.id}`);
    await this.logAudit({
      action: AuditAction.CREATE,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'OtpChallenge',
      entityId: challenge.id,
      description: 'OTP requested.',
      meta,
    });

    return { success: true, expiresInSeconds: this.otpTtlMinutes * 60 };
  }

  async verifyOtp(dto: OtpVerifyDto, meta: AuthRequestMeta) {
    const user = await this.findUserByIdentifier(dto.identifier);
    if (!user) {
      throw new UnauthorizedException('Invalid OTP.');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User is not active.');
    }

    const destination =
      dto.channel === OtpChannel.SMS ? user.phone : dto.channel === OtpChannel.EMAIL ? user.email : null;
    if (!destination) {
      throw new BadRequestException('Requested channel is not available for this user.');
    }

    const challenge = await this.prisma.otpChallenge.findFirst({
      where: {
        userId: user.id,
        channel: dto.channel,
        purpose: OtpPurpose.LOGIN,
        destination,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      throw new UnauthorizedException('Invalid OTP.');
    }
    if (challenge.attempts >= challenge.maxAttempts) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });
      throw new UnauthorizedException('Invalid OTP.');
    }

    const isValid = this.hashOtpCode(dto.code) === challenge.codeHash;
    if (!isValid) {
      const nextAttempts = challenge.attempts + 1;
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: {
          attempts: nextAttempts,
          consumedAt: nextAttempts >= challenge.maxAttempts ? new Date() : undefined,
        },
      });
      throw new UnauthorizedException('Invalid OTP.');
    }

    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    const profileIds = this.getProfileIds(user);
    const session = await this.createSession(user, meta);
    const tokens = await this.issueTokens(user, profileIds, meta, session.id);

    this.logger.log(`OTP login: ${user.id}`);
    await this.logAudit({
      action: AuditAction.LOGIN,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'User',
      entityId: user.id,
      description: 'User OTP login.',
      meta,
    });

    return {
      user: this.publicUser(user, profileIds),
      tokens,
    };
  }

  async login(dto: LoginDto, meta: AuthRequestMeta) {
    const user = (await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email: dto.identifier }, { phone: dto.identifier }],
      },
      include: {
        patient: { select: { id: true } },
        doctor: { select: { id: true } },
        admin: { select: { id: true } },
      },
    })) as UserWithProfiles | null;

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    if (dto.countryId && user.countryId !== dto.countryId) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User is not active.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const profileIds = this.getProfileIds(user);
    const session = await this.createSession(user, meta);
    const tokens = await this.issueTokens(user, profileIds, meta, session.id);
    this.logger.log(`User login: ${user.id}`);
    await this.logAudit({
      action: AuditAction.LOGIN,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'User',
      entityId: user.id,
      description: 'User password login.',
      meta,
    });
    return {
      user: this.publicUser(user, profileIds),
      tokens,
    };
  }

  async refresh(dto: RefreshTokenDto, meta: AuthRequestMeta) {
    const tokenHash = this.hashRefreshToken(dto.refreshToken);
    const existing = (await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            patient: { select: { id: true } },
            doctor: { select: { id: true } },
            admin: { select: { id: true } },
          },
        },
        session: {
          select: { id: true, status: true, revokedAt: true },
        },
      },
    })) as RefreshTokenWithUser | null;

    if (!existing || existing.revokedAt) {
      throw new UnauthorizedException('Refresh token is invalid.');
    }
    if (existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired.');
    }
    if (existing.user.deletedAt || existing.user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User is not active.');
    }

    if (existing.session && existing.session.status !== AuthSessionStatus.ACTIVE) {
      throw new UnauthorizedException('Session is not active.');
    }
    if (existing.session && existing.session.revokedAt) {
      throw new UnauthorizedException('Session is not active.');
    }

    const rotated = await this.rotateRefreshToken(existing, meta);
    const profileIds = this.getProfileIds(existing.user);
    const accessToken = await this.createAccessToken(existing.user, profileIds);

    this.logger.log(`Refresh token rotated: ${existing.userId}`);
    await this.logAudit({
      action: AuditAction.UPDATE,
      actorUserId: existing.userId,
      countryId: existing.user.countryId,
      entityType: 'RefreshToken',
      entityId: existing.id,
      description: 'Refresh token rotated.',
      meta,
    });
    return {
      user: this.publicUser(existing.user, profileIds),
      tokens: {
        accessToken,
        refreshToken: rotated.rawToken,
      },
    };
  }

  async logout(user: { id: string }, dto: LogoutDto, meta: AuthRequestMeta) {
    if (dto.refreshToken) {
      const tokenHash = this.hashRefreshToken(dto.refreshToken);
      const token = await this.prisma.refreshToken.findFirst({
        where: { userId: user.id, tokenHash },
        select: { sessionId: true },
      });
      if (token?.sessionId) {
        await this.revokeSession(token.sessionId, user.id, meta);
      } else {
        await this.prisma.refreshToken.updateMany({
          where: {
            userId: user.id,
            tokenHash,
            revokedAt: null,
          },
          data: { revokedAt: new Date(), userAgent: meta.userAgent, ipAddress: meta.ipAddress },
        });
      }
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date(), userAgent: meta.userAgent, ipAddress: meta.ipAddress },
      });
      await this.prisma.authSession.updateMany({
        where: { userId: user.id, status: AuthSessionStatus.ACTIVE },
        data: { status: AuthSessionStatus.REVOKED, revokedAt: new Date() },
      });
    }

    this.logger.log(`User logout: ${user.id}`);
    await this.logAudit({
      action: AuditAction.LOGOUT,
      actorUserId: user.id,
      entityType: 'User',
      entityId: user.id,
      description: 'User logout.',
      meta,
    });
    return { success: true };
  }

  async listSessions(user: { id: string }) {
    const sessions = await this.prisma.authSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        ipAddress: true,
        userAgent: true,
        lastUsedAt: true,
        createdAt: true,
        revokedAt: true,
      },
    });
    return { sessions };
  }

  async revokeSessionById(user: { id: string }, sessionId: string, meta: AuthRequestMeta) {
    await this.revokeSession(sessionId, user.id, meta);
    return { success: true };
  }

  private async issueTokens(
    user: User,
    profileIds: { patientId?: string | null; doctorId?: string | null; adminId?: string | null },
    meta: AuthRequestMeta,
    sessionId?: string,
  ): Promise<AuthTokens> {
    const accessToken = await this.createAccessToken(user, profileIds);
    const refreshToken = await this.createRefreshToken(user, meta, sessionId);
    return { accessToken, refreshToken };
  }

  private async createAccessToken(
    user: User,
    profileIds: { patientId?: string | null; doctorId?: string | null; adminId?: string | null },
  ): Promise<string> {
    return this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
      countryId: user.countryId,
      patientId: profileIds.patientId ?? null,
      doctorId: profileIds.doctorId ?? null,
      adminId: profileIds.adminId ?? null,
    });
  }

  private async createRefreshToken(
    user: User,
    meta: AuthRequestMeta,
    sessionId?: string,
  ): Promise<string> {
    const rawToken = randomBytes(64).toString('hex');
    const tokenHash = this.hashRefreshToken(rawToken);
    const expiresAt = this.addDays(new Date(), this.refreshTokenDays);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        countryId: user.countryId,
        tokenHash,
        expiresAt,
        sessionId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    return rawToken;
  }

  private async rotateRefreshToken(existing: RefreshTokenWithUser, meta: AuthRequestMeta) {
    const rawToken = randomBytes(64).toString('hex');
    const tokenHash = this.hashRefreshToken(rawToken);
    const expiresAt = this.addDays(new Date(), this.refreshTokenDays);

    const created = await this.prisma.$transaction(async (tx) => {
      const createdToken = await tx.refreshToken.create({
        data: {
          userId: existing.user.id,
          countryId: existing.user.countryId,
          tokenHash,
          expiresAt,
          sessionId: existing.sessionId ?? undefined,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });

      await tx.refreshToken.update({
        where: { id: existing.id },
        data: {
          revokedAt: new Date(),
          replacedById: createdToken.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });

      if (existing.sessionId) {
        await tx.authSession.update({
          where: { id: existing.sessionId },
          data: { lastUsedAt: new Date() },
        });
      }

      return createdToken;
    });

    return { rawToken, id: created.id };
  }

  private async createSession(user: User, meta: AuthRequestMeta) {
    return this.prisma.authSession.create({
      data: {
        userId: user.id,
        countryId: user.countryId,
        status: AuthSessionStatus.ACTIVE,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        lastUsedAt: new Date(),
      },
    });
  }

  private async revokeSession(sessionId: string, userId: string, meta: AuthRequestMeta) {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.authSession.updateMany({
        where: { id: sessionId, userId },
        data: { status: AuthSessionStatus.REVOKED, revokedAt: now },
      });
      await tx.refreshToken.updateMany({
        where: { sessionId, userId, revokedAt: null },
        data: { revokedAt: now, ipAddress: meta.ipAddress, userAgent: meta.userAgent },
      });
    });
    await this.logAudit({
      action: AuditAction.LOGOUT,
      actorUserId: userId,
      entityType: 'AuthSession',
      entityId: sessionId,
      description: 'Session revoked.',
      meta,
    });
  }

  private async findUserByIdentifier(identifier: string): Promise<UserWithProfiles | null> {
    return (await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email: identifier }, { phone: identifier }],
      },
      include: {
        patient: { select: { id: true } },
        doctor: { select: { id: true } },
        admin: { select: { id: true } },
      },
    })) as UserWithProfiles | null;
  }

  private getProfileIds(user: UserWithProfiles) {
    return {
      patientId: user.patient?.id ?? null,
      doctorId: user.doctor?.id ?? null,
      adminId: user.admin?.id ?? null,
    };
  }

  private publicUser(
    user: User,
    profileIds: { patientId?: string | null; doctorId?: string | null; adminId?: string | null },
  ) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      countryId: user.countryId,
      regionId: user.regionId,
      cityId: user.cityId,
      patientId: profileIds.patientId ?? null,
      doctorId: profileIds.doctorId ?? null,
      adminId: profileIds.adminId ?? null,
    };
  }

  private hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private hashOtpCode(code: string) {
    return createHash('sha256').update(code).digest('hex');
  }

  private generateOtpCode(length: number) {
    const bytes = randomBytes(length);
    let code = '';
    for (const byte of bytes) {
      code += (byte % 10).toString();
    }
    return code;
  }

  private addMinutes(date: Date, minutes: number) {
    const next = new Date(date);
    next.setMinutes(next.getMinutes() + minutes);
    return next;
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private get refreshTokenDays() {
    return Number(this.configService.get('JWT_REFRESH_DAYS', AUTH_CONFIG.refreshTokenDays));
  }

  private get otpTtlMinutes() {
    return Number(this.configService.get('OTP_TTL_MINUTES', AUTH_CONFIG.otpTtlMinutes));
  }

  private get otpMaxAttempts() {
    return Number(this.configService.get('OTP_MAX_ATTEMPTS', AUTH_CONFIG.otpMaxAttempts));
  }

  private get otpLength() {
    return Number(this.configService.get('OTP_LENGTH', AUTH_CONFIG.otpLength));
  }

  private async logAudit(params: {
    action: AuditAction;
    actorUserId?: string;
    countryId?: string;
    entityType: string;
    entityId: string;
    description?: string;
    meta?: AuthRequestMeta;
    metadata?: Record<string, unknown>;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: params.action,
          actorUserId: params.actorUserId,
          countryId: params.countryId,
          entityType: params.entityType,
          entityId: params.entityId,
          description: params.description,
          ipAddress: params.meta?.ipAddress,
          userAgent: params.meta?.userAgent,
          metadata: params.metadata,
        },
      });
    } catch (error) {
      this.logger.warn(`Audit log failed: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }
}
