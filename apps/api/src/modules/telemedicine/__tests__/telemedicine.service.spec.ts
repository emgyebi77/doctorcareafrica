import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppointmentStatus, AppointmentType, RoleType, VideoSessionStatus } from '@prisma/client';

import { AuditService } from '../../../common/audit/audit.service';
import { CountryService } from '../../../common/country/country.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { TelemedicineService } from '../telemedicine.service';

describe('TelemedicineService', () => {
  let service: TelemedicineService;
  let prisma: jest.Mocked<PrismaService>;
  let auditService: jest.Mocked<AuditService>;
  let configService: jest.Mocked<ConfigService>;
  let countryService: jest.Mocked<CountryService>;

  beforeEach(() => {
    prisma = {
      appointment: { findFirst: jest.fn() },
      videoSession: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      videoToken: { create: jest.fn() },
      notification: { create: jest.fn(), createMany: jest.fn() },
    } as unknown as jest.Mocked<PrismaService>;
    auditService = { logAction: jest.fn() } as unknown as jest.Mocked<AuditService>;
    configService = { get: jest.fn() } as unknown as jest.Mocked<ConfigService>;
    configService.get.mockImplementation((_key: string, defaultValue?: string | number) => defaultValue);
    countryService = {
      getCountrySettings: jest.fn(),
      resolveJitsiRegion: jest.fn(),
      formatInTimeZone: jest.fn(),
    } as unknown as jest.Mocked<CountryService>;
    countryService.getCountrySettings.mockResolvedValue({
      id: 'country-id',
      currency: 'GHS',
      currencySymbol: '₵',
      timezone: 'Africa/Accra',
      locale: 'en-GH',
      jitsiRegion: 'africa',
      momoProvider: null,
      momoProviders: null,
      supportedLocales: null,
    });
    countryService.resolveJitsiRegion.mockReturnValue('africa');
    countryService.formatInTimeZone.mockReturnValue('2025-01-01T10:00:00');
    service = new TelemedicineService(prisma, auditService, configService, countryService);
  });

  it('rejects non-video appointment session creation', async () => {
    prisma.appointment.findFirst.mockResolvedValue({
      id: 'appointment-id',
      type: AppointmentType.IN_PERSON,
      status: AppointmentStatus.SCHEDULED,
      countryId: 'country-id',
      patientId: 'patient-id',
      doctorId: 'doctor-id',
      patient: { id: 'patient-id', userId: 'patient-user-id' },
      doctor: { id: 'doctor-id', userId: 'doctor-user-id' },
      videoSession: null,
    } as never);

    await expect(
      service.createSession(
        {
          id: 'patient-user-id',
          role: RoleType.PATIENT,
          patientId: 'patient-id',
          countryId: 'country-id',
        },
        { appointmentId: 'appointment-id' },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unauthorized token generation', async () => {
    prisma.videoSession.findFirst.mockResolvedValue({
      id: 'session-id',
      status: VideoSessionStatus.SCHEDULED,
      countryId: 'country-id',
      appointment: {
        patientId: 'patient-id',
        doctorId: 'doctor-id',
        patient: { id: 'patient-id', userId: 'patient-user-id' },
        doctor: { id: 'doctor-id', userId: 'doctor-user-id' },
      },
      joinUrl: 'https://meet.jit.si/room',
    } as never);

    await expect(
      service.generateJoinToken(
        {
          id: 'other-user-id',
          role: RoleType.PATIENT,
          patientId: 'other-patient',
          countryId: 'country-id',
        },
        'session-id',
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
