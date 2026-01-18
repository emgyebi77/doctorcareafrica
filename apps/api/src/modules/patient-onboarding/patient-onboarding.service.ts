import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, OtpChannel, RoleType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

import { AuditService } from '../../common/audit/audit.service';
import { CountryService } from '../../common/country/country.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { EmergencyContactDto } from './dto/emergency-contact.dto';
import { MedicalHistoryDto } from './dto/medical-history.dto';
import { PhoneOtpRequestDto } from './dto/phone-otp-request.dto';
import { PhoneOtpVerifyDto } from './dto/phone-otp-verify.dto';
import { ProfileSetupDto } from './dto/profile-setup.dto';

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class PatientOnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
    private readonly countryService: CountryService,
  ) {}

  async requestPhoneOtp(dto: PhoneOtpRequestDto, meta: RequestMeta) {
    const { timezone, locale } = await this.countryService.resolveLocalization({
      countryId: dto.countryId,
    });

    let user = await this.prisma.user.findFirst({
      where: { phone: dto.phone, deletedAt: null },
      include: { patient: { select: { id: true } } },
    });

    if (!user) {
      const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
      user = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            phone: dto.phone,
            email: `${randomBytes(12).toString('hex')}@placeholder.local`,
            passwordHash,
            role: RoleType.PATIENT,
            countryId: dto.countryId,
            timezone,
            locale,
          },
          include: { patient: { select: { id: true } } },
        });
        await tx.patient.create({
          data: { userId: user.id, countryId: user.countryId },
        });
        return user;
      });
    }

    if (user.role !== RoleType.PATIENT) {
      throw new ForbiddenException('Only patients can use this flow.');
    }

    await this.authService.requestOtp(
      { identifier: dto.phone, channel: OtpChannel.SMS },
      meta,
    );

    return { success: true };
  }

  async verifyPhoneOtp(dto: PhoneOtpVerifyDto, meta: RequestMeta) {
    const user = await this.prisma.user.findFirst({
      where: { phone: dto.phone, deletedAt: null },
      select: { id: true, role: true, countryId: true },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    if (user.role !== RoleType.PATIENT) {
      throw new ForbiddenException('Only patients can use this flow.');
    }

    const authResult = await this.authService.verifyOtp(
      { identifier: dto.phone, channel: OtpChannel.SMS, code: dto.code },
      meta,
    );

    return authResult;
  }

  async listCountries() {
    const countries = await this.prisma.country.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        isoCode2: true,
        currency: true,
        currencySymbol: true,
        timezone: true,
        locale: true,
        dialingCode: true,
        jitsiRegion: true,
        momoProvider: true,
        momoProviders: true,
        supportedLocales: true,
      },
    });
    return { countries };
  }

  async setupProfile(user: RequestUser, dto: ProfileSetupDto, meta: RequestMeta) {
    if (!user.patientId) {
      throw new ForbiddenException('Patient profile not found.');
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
      await tx.patient.update({
        where: { id: user.patientId },
        data: {
          dateOfBirth: dto.dateOfBirth,
          gender: dto.gender,
          bloodType: dto.bloodType,
          regionId: dto.regionId,
          cityId: dto.cityId,
        },
      });
    });

    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'Patient',
      entityId: user.patientId,
      description: 'Patient profile setup completed.',
      meta,
    });

    return { success: true };
  }

  async updateEmergencyContact(user: RequestUser, dto: EmergencyContactDto, meta: RequestMeta) {
    if (!user.patientId) {
      throw new ForbiddenException('Patient profile not found.');
    }

    await this.prisma.patient.update({
      where: { id: user.patientId },
      data: {
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
      },
    });

    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'Patient',
      entityId: user.patientId,
      description: 'Patient emergency contact updated.',
      meta,
    });

    return { success: true };
  }

  async updateMedicalHistory(user: RequestUser, dto: MedicalHistoryDto, meta: RequestMeta) {
    if (!user.patientId) {
      throw new ForbiddenException('Patient profile not found.');
    }

    const record = await this.prisma.medicalRecord.upsert({
      where: { patientId: user.patientId },
      update: {
        allergies: dto.allergies,
        conditions: dto.conditions,
        medications: dto.medications,
      },
      create: {
        patientId: user.patientId,
        countryId: user.countryId,
        allergies: dto.allergies,
        conditions: dto.conditions,
        medications: dto.medications,
      },
    });

    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'MedicalRecord',
      entityId: record.id,
      description: 'Patient medical history updated.',
      meta,
    });

    return { success: true };
  }
}
