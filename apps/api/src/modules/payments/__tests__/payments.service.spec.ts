import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus, RefundStatus, RoleType, TransactionStatus } from '@prisma/client';

import { AuditService } from '../../../common/audit/audit.service';
import { CountryService } from '../../../common/country/country.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentsService } from '../payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: jest.Mocked<PrismaService>;
  let auditService: jest.Mocked<AuditService>;
  let configService: jest.Mocked<ConfigService>;
  let countryService: jest.Mocked<CountryService>;

  beforeEach(() => {
    prisma = {
      appointment: { findFirst: jest.fn() },
      payment: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      transaction: { create: jest.fn(), updateMany: jest.fn() },
      wallet: { findUnique: jest.fn(), create: jest.fn() },
      paymentRefund: { create: jest.fn(), update: jest.fn() },
      patient: { findUnique: jest.fn() },
      notification: { create: jest.fn() },
      webhookEvent: { create: jest.fn(), update: jest.fn() },
      $transaction: jest.fn(),
    } as unknown as jest.Mocked<PrismaService>;
    auditService = { logAction: jest.fn() } as unknown as jest.Mocked<AuditService>;
    configService = { get: jest.fn() } as unknown as jest.Mocked<ConfigService>;
    countryService = {
      getCountrySettings: jest.fn(),
      resolveCurrency: jest.fn(),
      resolveMomoProvider: jest.fn(),
    } as unknown as jest.Mocked<CountryService>;
    configService.get.mockImplementation((_key: string, defaultValue?: string | number) => defaultValue);
    service = new PaymentsService(prisma, auditService, configService, countryService);
  });

  it('creates checkout and transaction', async () => {
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
    countryService.resolveCurrency.mockReturnValue('GHS');
    countryService.resolveMomoProvider.mockReturnValue('MTN');
    prisma.wallet.findUnique.mockResolvedValue(null);
    prisma.wallet.create.mockResolvedValue({ id: 'wallet-id', currency: 'GHS' } as never);
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        payment: { create: jest.fn().mockResolvedValue({ id: 'payment-id' }) },
        transaction: { create: jest.fn() },
      } as never),
    );

    await expect(
      service.createCheckout(
        { id: 'user-id', role: RoleType.PATIENT, patientId: 'patient-id', countryId: 'country-id' },
        { amount: 50, currency: 'GHS', provider: 'MOMO', momoPhone: '+2330000000' },
        {},
      ),
    ).resolves.toEqual(
      expect.objectContaining({ paymentId: 'payment-id', provider: 'MOMO' }),
    );
  });

  it('rejects refund for non-captured payment', async () => {
    prisma.payment.findFirst.mockResolvedValue({
      id: 'payment-id',
      status: PaymentStatus.PENDING,
      amount: 50,
      currency: 'GHS',
      countryId: 'country-id',
      patientId: 'patient-id',
      patient: { userId: 'user-id' },
    } as never);

    await expect(
      service.refundPayment(
        { id: 'user-id', role: RoleType.PATIENT, countryId: 'country-id' },
        'payment-id',
        { amount: 10 },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents non-admin confirm', async () => {
    await expect(
      service.confirmPayment(
        { id: 'user-id', role: RoleType.PATIENT, countryId: 'country-id' },
        'payment-id',
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('marks refund succeeded', async () => {
    prisma.paymentRefund.update.mockResolvedValue({
      id: 'refund-id',
      status: RefundStatus.SUCCEEDED,
      payment: { id: 'payment-id', countryId: 'country-id', patient: { userId: 'user-id' } },
    } as never);
    prisma.payment.update.mockResolvedValue({ id: 'payment-id' } as never);
    prisma.transaction.updateMany.mockResolvedValue({ count: 1 } as never);

    await expect(
      service['markRefundSucceeded']('payment-id', 'refund-id', {}),
    ).resolves.toBeUndefined();
  });
});
