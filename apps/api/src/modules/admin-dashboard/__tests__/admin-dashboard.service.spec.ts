import { BadRequestException } from '@nestjs/common';
import { RoleType, UserStatus } from '@prisma/client';

import { AuditService } from '../../../common/audit/audit.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { DoctorOnboardingService } from '../../doctor-onboarding/doctor-onboarding.service';
import { PaymentsService } from '../../payments/payments.service';
import { AdminDashboardService } from '../admin-dashboard.service';

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;
  let prisma: jest.Mocked<PrismaService>;
  let auditService: jest.Mocked<AuditService>;
  let doctorOnboardingService: jest.Mocked<DoctorOnboardingService>;
  let paymentsService: jest.Mocked<PaymentsService>;

  beforeEach(() => {
    prisma = {
      user: { findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
      doctor: { count: jest.fn() },
      patient: { count: jest.fn() },
      appointment: { count: jest.fn(), groupBy: jest.fn(), findMany: jest.fn() },
      payment: { count: jest.fn(), groupBy: jest.fn(), findMany: jest.fn() },
      country: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
      region: { create: jest.fn(), update: jest.fn() },
      city: { create: jest.fn(), update: jest.fn() },
    } as unknown as jest.Mocked<PrismaService>;
    auditService = { logAction: jest.fn() } as unknown as jest.Mocked<AuditService>;
    doctorOnboardingService = {
      listPending: jest.fn(),
      approveOnboarding: jest.fn(),
      rejectOnboarding: jest.fn(),
    } as unknown as jest.Mocked<DoctorOnboardingService>;
    paymentsService = { listAdminPayments: jest.fn() } as unknown as jest.Mocked<PaymentsService>;
    service = new AdminDashboardService(prisma, auditService, doctorOnboardingService, paymentsService);
  });

  it('prevents admin from changing own status', async () => {
    await expect(
      service.updateUserStatus(
        { id: 'admin-id', role: RoleType.ADMIN, countryId: 'country-id' },
        'admin-id',
        { status: UserStatus.SUSPENDED },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates user status and logs audit', async () => {
    prisma.user.update.mockResolvedValue({
      id: 'user-id',
      countryId: 'country-id',
    } as never);

    await expect(
      service.updateUserStatus(
        { id: 'admin-id', role: RoleType.ADMIN, countryId: 'country-id' },
        'user-id',
        { status: UserStatus.SUSPENDED },
        {},
      ),
    ).resolves.toEqual({ success: true });
  });

  it('returns analytics summary', async () => {
    prisma.user.count.mockResolvedValue(10);
    prisma.doctor.count.mockResolvedValue(4);
    prisma.patient.count.mockResolvedValue(6);
    prisma.appointment.count.mockResolvedValue(12);
    prisma.payment.count.mockResolvedValue(8);
    prisma.appointment.groupBy.mockResolvedValue([{ status: 'SCHEDULED', _count: { _all: 4 } }] as never);
    prisma.payment.groupBy.mockResolvedValue([{ status: 'CAPTURED', _count: { _all: 2 } }] as never);

    await expect(
      service.analytics({ id: 'admin-id', role: RoleType.ADMIN, countryId: 'country-id' }),
    ).resolves.toEqual(
      expect.objectContaining({
        totals: {
          users: 10,
          doctors: 4,
          patients: 6,
          appointments: 12,
          payments: 8,
        },
      }),
    );
  });
});
