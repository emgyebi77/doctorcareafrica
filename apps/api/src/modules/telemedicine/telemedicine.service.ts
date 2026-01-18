import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AppointmentStatus,
  AppointmentType,
  AuditAction,
  RoleType,
  VideoSessionStatus,
} from '@prisma/client';
import { randomBytes } from 'crypto';

import { AuditService } from '../../common/audit/audit.service';
import { CountryService } from '../../common/country/country.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVideoSessionDto } from './dto/create-video-session.dto';

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class TelemedicineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
    private readonly countryService: CountryService,
  ) {}

  async createSession(user: RequestUser, dto: CreateVideoSessionDto, meta: RequestMeta) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: dto.appointmentId, deletedAt: null },
      include: {
        patient: { select: { id: true, userId: true } },
        doctor: { select: { id: true, userId: true } },
        videoSession: true,
      },
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found.');
    }
    if (appointment.type !== AppointmentType.VIDEO) {
      throw new BadRequestException('Video session requires a video appointment.');
    }
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot create session for cancelled appointment.');
    }
    this.assertSessionAccess(user, appointment.patientId, appointment.doctorId);
    if (appointment.videoSession) {
      throw new BadRequestException('Video session already exists.');
    }

    const roomId = this.generateRoomId(dto.appointmentId);
    const country = await this.countryService.getCountrySettings(appointment.countryId);
    const jitsiRegion = this.countryService.resolveJitsiRegion(country, dto.jitsiRegion);
    const joinUrl = this.buildJoinUrl(roomId, jitsiRegion);
    const session = await this.prisma.videoSession.create({
      data: {
        appointmentId: appointment.id,
        countryId: appointment.countryId,
        provider: 'JITSI',
        jitsiRegion,
        status: VideoSessionStatus.SCHEDULED,
        roomId,
        joinUrl,
      },
    });

    await this.auditService.logAction({
      action: AuditAction.CREATE,
      actorUserId: user.id,
      countryId: appointment.countryId,
      entityType: 'VideoSession',
      entityId: session.id,
      description: 'Video session created.',
      meta,
    });

    return { success: true, sessionId: session.id, joinUrl: session.joinUrl };
  }

  async generateJoinToken(user: RequestUser, sessionId: string, meta: RequestMeta) {
    const session = await this.prisma.videoSession.findFirst({
      where: { id: sessionId, deletedAt: null },
      include: {
        appointment: {
          include: {
            patient: { select: { id: true, userId: true } },
            doctor: { select: { id: true, userId: true } },
          },
        },
      },
    });
    if (!session) {
      throw new NotFoundException('Video session not found.');
    }
    this.assertSessionAccess(user, session.appointment.patientId, session.appointment.doctorId);
    if (session.status === VideoSessionStatus.ENDED) {
      throw new BadRequestException('Session has ended.');
    }

    const token = randomBytes(48).toString('hex');
    const expiresAt = this.addHours(new Date(), this.tokenHours);

    await this.prisma.videoToken.create({
      data: {
        videoSessionId: session.id,
        userId: user.id,
        token,
        expiresAt,
      },
    });

    await this.auditService.logAction({
      action: AuditAction.CREATE,
      actorUserId: user.id,
      countryId: session.countryId,
      entityType: 'VideoToken',
      entityId: session.id,
      description: 'Join token issued.',
      meta,
    });

    return { token, joinUrl: session.joinUrl, expiresAt };
  }

  async startSession(user: RequestUser, sessionId: string, meta: RequestMeta) {
    const session = await this.getSessionWithAccess(user, sessionId);
    if (session.status === VideoSessionStatus.ENDED) {
      throw new BadRequestException('Session has ended.');
    }

    const updated = await this.prisma.videoSession.update({
      where: { id: session.id },
      data: { status: VideoSessionStatus.LIVE, startedAt: new Date() },
    });

    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: user.id,
      countryId: session.countryId,
      entityType: 'VideoSession',
      entityId: updated.id,
      description: 'Video session started.',
      meta,
    });

    return { success: true };
  }

  async endSession(user: RequestUser, sessionId: string, meta: RequestMeta) {
    const session = await this.getSessionWithAccess(user, sessionId);
    if (session.status === VideoSessionStatus.ENDED) {
      throw new BadRequestException('Session has already ended.');
    }

    const updated = await this.prisma.videoSession.update({
      where: { id: session.id },
      data: { status: VideoSessionStatus.ENDED, endedAt: new Date() },
    });

    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: user.id,
      countryId: session.countryId,
      entityType: 'VideoSession',
      entityId: updated.id,
      description: 'Video session ended.',
      meta,
    });

    return { success: true };
  }

  async getSession(user: RequestUser, sessionId: string) {
    const session = await this.prisma.videoSession.findFirst({
      where: { id: sessionId, deletedAt: null },
      include: {
        appointment: {
          include: {
            patient: { include: { user: true } },
            doctor: { include: { user: true } },
          },
        },
      },
    });
    if (!session) {
      throw new NotFoundException('Video session not found.');
    }
    this.assertSessionAccess(user, session.appointment.patientId, session.appointment.doctorId);

    const country = await this.countryService.getCountrySettings(session.countryId);
    const appointmentTimezone = session.appointment.timezone ?? country.timezone;

    return {
      session: {
        id: session.id,
        status: session.status,
        provider: session.provider,
        joinUrl: session.joinUrl,
        roomId: session.roomId,
        jitsiRegion: session.jitsiRegion,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
      },
      appointment: {
        id: session.appointment.id,
        startTime: session.appointment.startTime,
        endTime: session.appointment.endTime,
        timezone: appointmentTimezone,
        localStartTime: this.countryService.formatInTimeZone(
          session.appointment.startTime,
          appointmentTimezone,
          country.locale,
        ),
        localEndTime: this.countryService.formatInTimeZone(
          session.appointment.endTime,
          appointmentTimezone,
          country.locale,
        ),
        locale: country.locale,
      },
      patient: {
        id: session.appointment.patient.id,
        name: this.formatName(
          session.appointment.patient.user.firstName,
          session.appointment.patient.user.lastName,
        ),
        phone: session.appointment.patient.user.phone,
      },
      doctor: {
        id: session.appointment.doctor.id,
        name: this.formatName(
          session.appointment.doctor.user.firstName,
          session.appointment.doctor.user.lastName,
        ),
        specialty: session.appointment.doctor.specialty,
      },
    };
  }

  private async getSessionWithAccess(user: RequestUser, sessionId: string) {
    const session = await this.prisma.videoSession.findFirst({
      where: { id: sessionId, deletedAt: null },
      include: {
        appointment: {
          select: { patientId: true, doctorId: true },
        },
      },
    });
    if (!session) {
      throw new NotFoundException('Video session not found.');
    }
    this.assertSessionAccess(user, session.appointment.patientId, session.appointment.doctorId);
    return session;
  }

  private assertSessionAccess(user: RequestUser, patientId: string, doctorId: string) {
    if (user.role === RoleType.PATIENT && user.patientId !== patientId) {
      throw new ForbiddenException('Access denied.');
    }
    if (user.role === RoleType.DOCTOR && user.doctorId !== doctorId) {
      throw new ForbiddenException('Access denied.');
    }
  }

  private buildJoinUrl(roomId: string, region?: string) {
    const domain = this.configService.get<string>('JITSI_DOMAIN', 'https://meet.jit.si');
    const base = domain.replace(/\/$/, '');
    if (!region) {
      return `${base}/${roomId}`;
    }
    return `${base}/${roomId}#config.deploymentInfo.region="${region}"`;
  }

  private generateRoomId(seed: string) {
    const suffix = randomBytes(4).toString('hex');
    return `dca-${seed.slice(0, 8)}-${suffix}`;
  }

  private addHours(date: Date, hours: number) {
    const next = new Date(date);
    next.setHours(next.getHours() + hours);
    return next;
  }

  private get tokenHours() {
    return Number(this.configService.get('VIDEO_TOKEN_HOURS', 2));
  }

  private formatName(firstName?: string | null, lastName?: string | null) {
    return [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
  }
}
