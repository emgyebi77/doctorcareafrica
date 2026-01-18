import { ForbiddenException } from '@nestjs/common';
import { RoleType } from '@prisma/client';

import { AuditService } from '../../../common/audit/audit.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import { PatientOnboardingService } from '../patient-onboarding.service';

describe('PatientOnboardingService', () => {
  let service: PatientOnboardingService;
  let prisma: jest.Mocked<PrismaService>;
  let authService: jest.Mocked<AuthService>;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(() => {
    prisma = {
      country: { findUnique: jest.fn() },
      user: { findFirst: jest.fn() },
      patient: { create: jest.fn() },
      medicalRecord: { upsert: jest.fn() },
      $transaction: jest.fn(),
    } as unknown as jest.Mocked<PrismaService>;
    authService = {
      requestOtp: jest.fn(),
      verifyOtp: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;
    auditService = { logAction: jest.fn() } as unknown as jest.Mocked<AuditService>;
    service = new PatientOnboardingService(prisma, authService, auditService);
  });

  it('creates user when requesting phone OTP', async () => {
    prisma.country.findUnique.mockResolvedValue({ id: 'country-id' } as never);
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        user: {
          create: jest.fn().mockResolvedValue({
            id: 'user-id',
            phone: '+23300000000',
            role: RoleType.PATIENT,
            countryId: 'country-id',
          }),
        },
        patient: { create: jest.fn().mockResolvedValue({ id: 'patient-id' }) },
      } as never),
    );
    authService.requestOtp.mockResolvedValue({ success: true } as never);

    await expect(
      service.requestPhoneOtp({ phone: '+23300000000', countryId: 'country-id' }, {}),
    ).resolves.toEqual({ success: true });
  });

  it('rejects non-patient OTP verification', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-id',
      role: RoleType.DOCTOR,
      countryId: 'country-id',
    } as never);

    await expect(
      service.verifyPhoneOtp({ phone: '+23300000000', code: '123456' }, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
