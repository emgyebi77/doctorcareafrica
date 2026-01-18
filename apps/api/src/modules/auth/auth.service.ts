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
import { RoleType, User, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { AUTH_CONFIG } from './auth.constants';
import { AuthTokens } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
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

    const tokens = await this.issueTokens(user, profileIds, meta);
    this.logger.log(`User registered: ${user.id}`);
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

    const profileIds = {
      patientId: user.patient?.id ?? null,
      doctorId: user.doctor?.id ?? null,
      adminId: user.admin?.id ?? null,
    };
    const tokens = await this.issueTokens(user, profileIds, meta);
    this.logger.log(`User login: ${user.id}`);
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

    const rotated = await this.rotateRefreshToken(existing, meta);
    const profileIds = {
      patientId: existing.user.patient?.id ?? null,
      doctorId: existing.user.doctor?.id ?? null,
      adminId: existing.user.admin?.id ?? null,
    };
    const accessToken = await this.createAccessToken(existing.user, profileIds);

    this.logger.log(`Refresh token rotated: ${existing.userId}`);
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
      await this.prisma.refreshToken.updateMany({
        where: {
          userId: user.id,
          tokenHash,
          revokedAt: null,
        },
        data: { revokedAt: new Date(), userAgent: meta.userAgent, ipAddress: meta.ipAddress },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date(), userAgent: meta.userAgent, ipAddress: meta.ipAddress },
      });
    }

    this.logger.log(`User logout: ${user.id}`);
    return { success: true };
  }

  private async issueTokens(
    user: User,
    profileIds: { patientId?: string | null; doctorId?: string | null; adminId?: string | null },
    meta: AuthRequestMeta,
  ): Promise<AuthTokens> {
    const accessToken = await this.createAccessToken(user, profileIds);
    const refreshToken = await this.createRefreshToken(user, meta);
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

  private async createRefreshToken(user: User, meta: AuthRequestMeta): Promise<string> {
    const rawToken = randomBytes(64).toString('hex');
    const tokenHash = this.hashRefreshToken(rawToken);
    const expiresAt = this.addDays(new Date(), this.refreshTokenDays);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        countryId: user.countryId,
        tokenHash,
        expiresAt,
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

      return createdToken;
    });

    return { rawToken, id: created.id };
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

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private get refreshTokenDays() {
    return Number(this.configService.get('JWT_REFRESH_DAYS', AUTH_CONFIG.refreshTokenDays));
  }
}
