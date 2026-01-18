import { ForbiddenException } from '@nestjs/common';
import { DoctorOnboardingStatus, OtpChannel, RoleType } from '@prisma/client';

import { AuditService } from '../../../common/audit/audit.service';
import { CountryService } from '../../../common/country/country.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import { DoctorOnboardingService } from '../doctor-onboarding.service';

describe('DoctorOnboardingService', () => {
  let service: DoctorOnboardingService;
  let prisma: jest.Mocked<PrismaService>;
  let authService: jest.Mocked<AuthService>;
  let auditService: jest.Mocked<AuditService>;
  let countryService: jest.Mocked<CountryService>;

  beforeEach(() => {
    prisma = {
      country: { findUnique: jest.fn() },
      user: { findFirst: jest.fn(), create: jest.fn() },
      doctor: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      doctorOnboarding: { create: jest.fn(), upsert: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      doctorKycDocument: { count: jest.fn(), update: jest.fn() },
      attachment: { create: jest.fn() },
      availability: { create: jest.fn(), findFirst: jest.fn() },
      timeSlot: { create: jest.fn() },
      notification: { create: jest.fn() },
      $transaction: jest.fn(),
    } as unknown as jest.Mocked<PrismaService>;
    authService = {
      requestOtp: jest.fn(),
      verifyOtp: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;
    auditService = { logAction: jest.fn() } as unknown as jest.Mocked<AuditService>;
    countryService = {
      getCountrySettings: jest.fn(),
      resolveLocalization: jest.fn(),
    } as unknown as jest.Mocked<CountryService>;
    countryService.getCountrySettings.mockResolvedValue({
      id: 'country-id',
      currency: 'GHS',
      currencySymbol: '₵',
      timezone: 'Africa/Accra',
      locale: 'en-GH',
      jitsiRegion: null,
      momoProvider: null,
      momoProviders: null,
      supportedLocales: null,
    });
    countryService.resolveLocalization.mockResolvedValue({
      country: {
        id: 'country-id',
        currency: 'GHS',
        currencySymbol: '₵',
        timezone: 'Africa/Accra',
        locale: 'en-GH',
        jitsiRegion: null,
        momoProvider: null,
        momoProviders: null,
        supportedLocales: null,
      },
      timezone: 'Africa/Accra',
      locale: 'en-GH',
    });
    service = new DoctorOnboardingService(prisma, authService, auditService, countryService);
  });

  it('creates doctor user and requests OTP', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        user: {
          create: jest.fn().mockResolvedValue({
            id: 'user-id',
            email: 'doctor@example.com',
            role: RoleType.DOCTOR,
            countryId: 'country-id',
          }),
        },
        doctor: { create: jest.fn().mockResolvedValue({ id: 'doctor-id' }) },
        doctorOnboarding: { create: jest.fn().mockResolvedValue({ id: 'onboarding-id' }) },
      } as never),
    );
    authService.requestOtp.mockResolvedValue({ success: true } as never);

    await expect(
      service.requestOtp(
        { channel: OtpChannel.EMAIL, email: 'doctor@example.com', countryId: 'country-id' },
        {},
      ),
    ).resolves.toEqual({ success: true });
  });

  it('rejects pending list for non-admin', async () => {
    await expect(
      service.listPending({ id: 'user-id', role: RoleType.DOCTOR, countryId: 'country-id' } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('submits onboarding when specialty and documents exist', async () => {
    prisma.doctor.findUnique.mockResolvedValue({ specialty: 'Cardiology' } as never);
    prisma.doctorKycDocument.count.mockResolvedValue(2);
    prisma.doctorOnboarding.upsert.mockResolvedValue({
      id: 'onboarding-id',
      status: DoctorOnboardingStatus.SUBMITTED,
    } as never);
    prisma.notification.create.mockResolvedValue({ id: 'notification-id' } as never);

    await expect(
      service.submitOnboarding(
        { id: 'user-id', role: RoleType.DOCTOR, countryId: 'country-id', doctorId: 'doctor-id' },
        {},
      ),
    ).resolves.toEqual({ success: true });
  });
});
