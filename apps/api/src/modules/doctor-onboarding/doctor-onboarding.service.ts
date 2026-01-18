import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  DoctorOnboardingStatus,
  KycDocumentStatus,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  OtpChannel,
  RoleType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

import { AuditService } from '../../common/audit/audit.service';
import { CountryService } from '../../common/country/country.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { DoctorAvailabilityDto } from './dto/doctor-availability.dto';
import { DoctorDocumentDto } from './dto/doctor-document.dto';
import { DoctorOtpRequestDto } from './dto/doctor-otp-request.dto';
import { DoctorOtpVerifyDto } from './dto/doctor-otp-verify.dto';
import { DoctorProfileDto } from './dto/doctor-profile.dto';
import { DoctorReviewDto } from './dto/doctor-review.dto';
import { DoctorTimeSlotDto } from './dto/doctor-timeslot.dto';

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class DoctorOnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
    private readonly countryService: CountryService,
  ) {}

  async requestOtp(dto: DoctorOtpRequestDto, meta: RequestMeta) {
    const identifier = this.getIdentifier(dto);
    await this.countryService.getCountrySettings(dto.countryId);

    const user = await this.getOrCreateDoctorUser(dto, identifier);
    await this.authService.requestOtp({ identifier, channel: dto.channel }, meta);

    await this.auditService.logAction({
      action: AuditAction.CREATE,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'OtpChallenge',
      entityId: user.id,
      description: 'Doctor onboarding OTP requested.',
      meta,
    });

    return { success: true };
  }

  async verifyOtp(dto: DoctorOtpVerifyDto, meta: RequestMeta) {
    const identifier = this.getIdentifier(dto);
    const user = await this.prisma.user.findFirst({
      where: { deletedAt: null, OR: [{ email: identifier }, { phone: identifier }] },
      select: { id: true, role: true, countryId: true },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    if (user.role !== RoleType.DOCTOR) {
      throw new ForbiddenException('Only doctors can use this flow.');
    }

    const authResult = await this.authService.verifyOtp(
      { identifier, channel: dto.channel, code: dto.code },
      meta,
    );

    await this.auditService.logAction({
      action: AuditAction.LOGIN,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'User',
      entityId: user.id,
      description: 'Doctor onboarding OTP login.',
      meta,
    });

    return authResult;
  }

  async updateProfile(user: RequestUser, dto: DoctorProfileDto, meta: RequestMeta) {
    if (!user.doctorId) {
      throw new ForbiddenException('Doctor profile not found.');
    }

    const { timezone, locale } = await this.countryService.resolveLocalization({
      countryId: user.countryId,
      cityId: dto.cityId,
      timezone: dto.timezone,
      locale: dto.locale,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          regionId: dto.regionId,
          cityId: dto.cityId,
          timezone,
          locale,
        },
      });
      await tx.doctor.update({
        where: { id: user.doctorId },
        data: {
          licenseNumber: dto.licenseNumber,
          specialty: dto.specialty,
          yearsExperience: dto.yearsExperience,
          bio: dto.bio,
          regionId: dto.regionId,
          cityId: dto.cityId,
        },
      });
      await tx.doctorOnboarding.upsert({
        where: { doctorId: user.doctorId },
        update: {},
        create: {
          doctorId: user.doctorId,
          countryId: user.countryId,
          status: DoctorOnboardingStatus.DRAFT,
        },
      });
    });

    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'Doctor',
      entityId: user.doctorId,
      description: 'Doctor profile updated.',
      meta,
    });

    return { success: true };
  }

  async uploadDocument(user: RequestUser, dto: DoctorDocumentDto, meta: RequestMeta) {
    if (!user.doctorId) {
      throw new ForbiddenException('Doctor profile not found.');
    }

    const document = await this.prisma.$transaction(async (tx) => {
      const attachment = await tx.attachment.create({
        data: {
          uploadedByUserId: user.id,
          countryId: user.countryId,
          fileName: dto.fileName,
          fileUrl: dto.fileUrl,
          mimeType: dto.mimeType,
          sizeBytes: dto.sizeBytes,
          checksum: dto.checksum,
          storageProvider: dto.storageProvider,
        },
      });

      return tx.doctorKycDocument.create({
        data: {
          doctorId: user.doctorId,
          countryId: user.countryId,
          attachmentId: attachment.id,
          type: dto.type,
        },
      });
    });

    await this.auditService.logAction({
      action: AuditAction.CREATE,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'DoctorKycDocument',
      entityId: document.id,
      description: 'Doctor KYC document uploaded.',
      meta,
    });

    return { success: true, documentId: document.id };
  }

  async createAvailability(user: RequestUser, dto: DoctorAvailabilityDto, meta: RequestMeta) {
    if (!user.doctorId) {
      throw new ForbiddenException('Doctor profile not found.');
    }
    if (dto.endTime <= dto.startTime) {
      throw new BadRequestException('Availability end time must be after start time.');
    }

    const availability = await this.prisma.availability.create({
      data: {
        doctorId: user.doctorId,
        countryId: user.countryId,
        type: dto.type,
        dayOfWeek: dto.dayOfWeek,
        date: dto.date,
        startTime: dto.startTime,
        endTime: dto.endTime,
        timezone: dto.timezone,
      },
    });

    await this.auditService.logAction({
      action: AuditAction.CREATE,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'Availability',
      entityId: availability.id,
      description: 'Doctor availability created.',
      meta,
    });

    return { success: true, availabilityId: availability.id };
  }

  async createTimeSlot(user: RequestUser, dto: DoctorTimeSlotDto, meta: RequestMeta) {
    if (!user.doctorId) {
      throw new ForbiddenException('Doctor profile not found.');
    }
    if (dto.endTime <= dto.startTime) {
      throw new BadRequestException('Time slot end time must be after start time.');
    }

    const availability = await this.prisma.availability.findFirst({
      where: { id: dto.availabilityId, doctorId: user.doctorId },
      select: { id: true },
    });
    if (!availability) {
      throw new NotFoundException('Availability not found.');
    }

    const slot = await this.prisma.timeSlot.create({
      data: {
        availabilityId: availability.id,
        doctorId: user.doctorId,
        countryId: user.countryId,
        startTime: dto.startTime,
        endTime: dto.endTime,
        timezone: dto.timezone,
      },
    });

    await this.auditService.logAction({
      action: AuditAction.CREATE,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'TimeSlot',
      entityId: slot.id,
      description: 'Doctor time slot created.',
      meta,
    });

    return { success: true, timeSlotId: slot.id };
  }

  async submitOnboarding(user: RequestUser, meta: RequestMeta) {
    if (!user.doctorId) {
      throw new ForbiddenException('Doctor profile not found.');
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: user.doctorId },
      select: { specialty: true },
    });
    if (!doctor?.specialty) {
      throw new BadRequestException('Specialty is required.');
    }

    const documents = await this.prisma.doctorKycDocument.count({
      where: { doctorId: user.doctorId, deletedAt: null },
    });
    if (documents === 0) {
      throw new BadRequestException('At least one document is required.');
    }

    const onboarding = await this.prisma.doctorOnboarding.upsert({
      where: { doctorId: user.doctorId },
      update: {
        status: DoctorOnboardingStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      create: {
        doctorId: user.doctorId,
        countryId: user.countryId,
        status: DoctorOnboardingStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });

    await this.createNotification({
      userId: user.id,
      countryId: user.countryId,
      title: 'Onboarding submitted',
      message: 'Your onboarding has been submitted for review.',
    });

    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'DoctorOnboarding',
      entityId: onboarding.id,
      description: 'Doctor onboarding submitted.',
      meta,
    });

    return { success: true };
  }

  async listPending(user: RequestUser) {
    if (user.role !== RoleType.ADMIN && user.role !== RoleType.SUPER_ADMIN) {
      throw new ForbiddenException('Admin access required.');
    }

    const requests = await this.prisma.doctorOnboarding.findMany({
      where: { status: DoctorOnboardingStatus.SUBMITTED, deletedAt: null },
      orderBy: { submittedAt: 'desc' },
      include: {
        doctor: { include: { user: { select: { id: true, email: true, phone: true } } } },
      },
    });

    return { requests };
  }

  async approveOnboarding(user: RequestUser, id: string, dto: DoctorReviewDto, meta: RequestMeta) {
    if (user.role !== RoleType.ADMIN && user.role !== RoleType.SUPER_ADMIN) {
      throw new ForbiddenException('Admin access required.');
    }

    const onboarding = await this.prisma.doctorOnboarding.update({
      where: { id },
      data: {
        status: DoctorOnboardingStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedByUserId: user.id,
        reviewNotes: dto.notes,
      },
      include: { doctor: { include: { user: true } } },
    });

    await this.createNotification({
      userId: onboarding.doctor.userId,
      countryId: onboarding.countryId,
      title: 'Onboarding approved',
      message: 'Your onboarding has been approved.',
    });

    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: user.id,
      countryId: onboarding.countryId,
      entityType: 'DoctorOnboarding',
      entityId: onboarding.id,
      description: 'Doctor onboarding approved.',
      meta,
    });

    return { success: true };
  }

  async rejectOnboarding(user: RequestUser, id: string, dto: DoctorReviewDto, meta: RequestMeta) {
    if (user.role !== RoleType.ADMIN && user.role !== RoleType.SUPER_ADMIN) {
      throw new ForbiddenException('Admin access required.');
    }

    const onboarding = await this.prisma.doctorOnboarding.update({
      where: { id },
      data: {
        status: DoctorOnboardingStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedByUserId: user.id,
        reviewNotes: dto.notes,
      },
      include: { doctor: { include: { user: true } } },
    });

    await this.createNotification({
      userId: onboarding.doctor.userId,
      countryId: onboarding.countryId,
      title: 'Onboarding rejected',
      message: dto.notes
        ? `Your onboarding was rejected: ${dto.notes}`
        : 'Your onboarding was rejected. Please update your details.',
    });

    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: user.id,
      countryId: onboarding.countryId,
      entityType: 'DoctorOnboarding',
      entityId: onboarding.id,
      description: 'Doctor onboarding rejected.',
      meta,
    });

    return { success: true };
  }

  async approveDocument(user: RequestUser, id: string, dto: DoctorReviewDto, meta: RequestMeta) {
    if (user.role !== RoleType.ADMIN && user.role !== RoleType.SUPER_ADMIN) {
      throw new ForbiddenException('Admin access required.');
    }

    const document = await this.prisma.doctorKycDocument.update({
      where: { id },
      data: {
        status: KycDocumentStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedByUserId: user.id,
        reviewNotes: dto.notes,
      },
      include: { doctor: { include: { user: true } } },
    });

    await this.createNotification({
      userId: document.doctor.userId,
      countryId: document.countryId,
      title: 'Document approved',
      message: 'Your document has been approved.',
    });

    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: user.id,
      countryId: document.countryId,
      entityType: 'DoctorKycDocument',
      entityId: document.id,
      description: 'Doctor KYC document approved.',
      meta,
    });

    return { success: true };
  }

  async rejectDocument(user: RequestUser, id: string, dto: DoctorReviewDto, meta: RequestMeta) {
    if (user.role !== RoleType.ADMIN && user.role !== RoleType.SUPER_ADMIN) {
      throw new ForbiddenException('Admin access required.');
    }

    const document = await this.prisma.doctorKycDocument.update({
      where: { id },
      data: {
        status: KycDocumentStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedByUserId: user.id,
        reviewNotes: dto.notes,
      },
      include: { doctor: { include: { user: true } } },
    });

    await this.createNotification({
      userId: document.doctor.userId,
      countryId: document.countryId,
      title: 'Document rejected',
      message: dto.notes
        ? `Your document was rejected: ${dto.notes}`
        : 'Your document was rejected. Please upload a replacement.',
    });

    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: user.id,
      countryId: document.countryId,
      entityType: 'DoctorKycDocument',
      entityId: document.id,
      description: 'Doctor KYC document rejected.',
      meta,
    });

    return { success: true };
  }

  private async getOrCreateDoctorUser(dto: DoctorOtpRequestDto, identifier: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email: identifier }, { phone: identifier }],
      },
      include: { doctor: { select: { id: true } } },
    });

    if (user) {
      if (user.role !== RoleType.DOCTOR) {
        throw new ForbiddenException('Only doctors can use this flow.');
      }
      if (!user.doctor) {
        await this.prisma.doctor.create({
          data: { userId: user.id, countryId: user.countryId },
        });
      }
      return user;
    }

    const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
    const email =
      dto.channel === OtpChannel.EMAIL
        ? (dto.email as string)
        : `${randomBytes(12).toString('hex')}@placeholder.local`;
    const phone = dto.channel === OtpChannel.SMS ? (dto.phone as string) : undefined;

    const { timezone, locale } = await this.countryService.resolveLocalization({
      countryId: dto.countryId,
    });

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          phone,
          passwordHash,
          role: RoleType.DOCTOR,
          countryId: dto.countryId,
          timezone,
          locale,
        },
      });
      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          countryId: dto.countryId,
        },
      });
      await tx.doctorOnboarding.create({
        data: {
          doctorId: doctor.id,
          countryId: dto.countryId,
          status: DoctorOnboardingStatus.DRAFT,
        },
      });
      return { ...user, doctor: { id: doctor.id } };
    });
  }

  private getIdentifier(dto: DoctorOtpRequestDto | DoctorOtpVerifyDto) {
    if (dto.channel === OtpChannel.EMAIL && dto.email) {
      return dto.email;
    }
    if (dto.channel === OtpChannel.SMS && dto.phone) {
      return dto.phone;
    }
    throw new BadRequestException('Identifier is required.');
  }

  private async createNotification(params: {
    userId: string;
    countryId: string;
    title: string;
    message: string;
  }) {
    await this.prisma.notification.create({
      data: {
        userId: params.userId,
        countryId: params.countryId,
        type: NotificationType.SYSTEM,
        channel: NotificationChannel.IN_APP,
        title: params.title,
        message: params.message,
        status: NotificationStatus.UNREAD,
      },
    });
  }
}
