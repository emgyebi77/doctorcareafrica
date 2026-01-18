import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, RoleType } from '@prisma/client';

import { AuditService } from '../../common/audit/audit.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { DoctorOnboardingService } from '../doctor-onboarding/doctor-onboarding.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateCityDto } from './dto/create-city.dto';
import { CreateCountryDto } from './dto/create-country.dto';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly doctorOnboardingService: DoctorOnboardingService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async listUsers() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true } },
        doctor: { select: { id: true } },
        admin: { select: { id: true } },
      },
    });
    return { users };
  }

  async updateUserStatus(user: RequestUser, id: string, dto: UpdateUserStatusDto, meta: RequestMeta) {
    if (user.role !== RoleType.ADMIN && user.role !== RoleType.SUPER_ADMIN) {
      throw new ForbiddenException('Admin access required.');
    }
    if (id === user.id) {
      throw new BadRequestException('You cannot change your own status.');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
    });

    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: user.id,
      countryId: updated.countryId,
      entityType: 'User',
      entityId: updated.id,
      description: `User status updated to ${dto.status}.`,
      meta,
    });

    return { success: true };
  }

  async listDoctorApprovals(user: RequestUser) {
    return this.doctorOnboardingService.listPending(user);
  }

  async approveDoctor(user: RequestUser, id: string, notes: string | undefined, meta: RequestMeta) {
    return this.doctorOnboardingService.approveOnboarding(user, id, { notes }, meta);
  }

  async rejectDoctor(user: RequestUser, id: string, notes: string | undefined, meta: RequestMeta) {
    return this.doctorOnboardingService.rejectOnboarding(user, id, { notes }, meta);
  }

  async listAppointments(user: RequestUser) {
    if (user.role !== RoleType.ADMIN && user.role !== RoleType.SUPER_ADMIN) {
      throw new ForbiddenException('Admin access required.');
    }
    const appointments = await this.prisma.appointment.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });
    return { appointments };
  }

  async listPayments(user: RequestUser) {
    return this.paymentsService.listAdminPayments(user);
  }

  async listCountries(user: RequestUser) {
    this.assertAdmin(user);
    const countries = await this.prisma.country.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
    return { countries };
  }

  async createCountry(user: RequestUser, dto: CreateCountryDto, meta: RequestMeta) {
    this.assertAdmin(user);
    const country = await this.prisma.country.create({
      data: {
        name: dto.name,
        isoCode2: dto.isoCode2,
        isoCode3: dto.isoCode3,
        currency: dto.currency,
        currencySymbol: dto.currencySymbol,
        timezone: dto.timezone,
        locale: dto.locale,
        supportedLocales: dto.supportedLocales,
        jitsiRegion: dto.jitsiRegion,
        momoProvider: dto.momoProvider,
        momoProviders: dto.momoProviders,
        dialingCode: dto.dialingCode,
      },
    });
    await this.auditService.logAction({
      action: AuditAction.CREATE,
      actorUserId: user.id,
      countryId: country.id,
      entityType: 'Country',
      entityId: country.id,
      description: 'Country created.',
      meta,
    });
    return { success: true, countryId: country.id };
  }

  async updateCountry(user: RequestUser, id: string, dto: UpdateCountryDto, meta: RequestMeta) {
    this.assertAdmin(user);
    const country = await this.prisma.country.update({
      where: { id },
      data: {
        name: dto.name,
        currency: dto.currency,
        currencySymbol: dto.currencySymbol,
        timezone: dto.timezone,
        locale: dto.locale,
        supportedLocales: dto.supportedLocales,
        jitsiRegion: dto.jitsiRegion,
        momoProvider: dto.momoProvider,
        momoProviders: dto.momoProviders,
        dialingCode: dto.dialingCode,
      },
    });
    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: user.id,
      countryId: country.id,
      entityType: 'Country',
      entityId: country.id,
      description: 'Country updated.',
      meta,
    });
    return { success: true };
  }

  async createRegion(user: RequestUser, dto: CreateRegionDto, meta: RequestMeta) {
    this.assertAdmin(user);
    const region = await this.prisma.region.create({
      data: {
        countryId: dto.countryId,
        name: dto.name,
        code: dto.code,
      },
    });
    await this.auditService.logAction({
      action: AuditAction.CREATE,
      actorUserId: user.id,
      countryId: dto.countryId,
      entityType: 'Region',
      entityId: region.id,
      description: 'Region created.',
      meta,
    });
    return { success: true, regionId: region.id };
  }

  async updateRegion(user: RequestUser, id: string, dto: UpdateRegionDto, meta: RequestMeta) {
    this.assertAdmin(user);
    const region = await this.prisma.region.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
      },
    });
    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: user.id,
      countryId: region.countryId,
      entityType: 'Region',
      entityId: region.id,
      description: 'Region updated.',
      meta,
    });
    return { success: true };
  }

  async createCity(user: RequestUser, dto: CreateCityDto, meta: RequestMeta) {
    this.assertAdmin(user);
    const city = await this.prisma.city.create({
      data: {
        countryId: dto.countryId,
        regionId: dto.regionId,
        name: dto.name,
        timezone: dto.timezone,
        locale: dto.locale,
      },
    });
    await this.auditService.logAction({
      action: AuditAction.CREATE,
      actorUserId: user.id,
      countryId: dto.countryId,
      entityType: 'City',
      entityId: city.id,
      description: 'City created.',
      meta,
    });
    return { success: true, cityId: city.id };
  }

  async updateCity(user: RequestUser, id: string, dto: UpdateCityDto, meta: RequestMeta) {
    this.assertAdmin(user);
    const city = await this.prisma.city.update({
      where: { id },
      data: {
        name: dto.name,
        timezone: dto.timezone,
        locale: dto.locale,
      },
    });
    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: user.id,
      countryId: city.countryId,
      entityType: 'City',
      entityId: city.id,
      description: 'City updated.',
      meta,
    });
    return { success: true };
  }

  async analytics(user: RequestUser) {
    this.assertAdmin(user);
    const [users, doctors, patients, appointments, payments] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.doctor.count({ where: { deletedAt: null } }),
      this.prisma.patient.count({ where: { deletedAt: null } }),
      this.prisma.appointment.count({ where: { deletedAt: null } }),
      this.prisma.payment.count({ where: { deletedAt: null } }),
    ]);

    const appointmentsByStatus = await this.prisma.appointment.groupBy({
      by: ['status'],
      _count: { _all: true },
      where: { deletedAt: null },
    });
    const paymentsByStatus = await this.prisma.payment.groupBy({
      by: ['status'],
      _count: { _all: true },
      where: { deletedAt: null },
    });

    return {
      totals: {
        users,
        doctors,
        patients,
        appointments,
        payments,
      },
      appointmentsByStatus,
      paymentsByStatus,
    };
  }

  private assertAdmin(user: RequestUser) {
    if (user.role !== RoleType.ADMIN && user.role !== RoleType.SUPER_ADMIN) {
      throw new ForbiddenException('Admin access required.');
    }
  }
}
