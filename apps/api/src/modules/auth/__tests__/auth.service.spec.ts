import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OtpChannel, RoleType, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { AuthService } from '../auth.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(() => {
    prisma = {
      user: { findFirst: jest.fn(), update: jest.fn() },
      refreshToken: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      otpChallenge: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      authSession: {
        create: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      auditLog: { create: jest.fn() },
      $transaction: jest.fn(),
    } as unknown as jest.Mocked<PrismaService>;
    jwtService = { signAsync: jest.fn() } as unknown as jest.Mocked<JwtService>;
    configService = { get: jest.fn() } as unknown as jest.Mocked<ConfigService>;
    auditService = { logAction: jest.fn() } as unknown as jest.Mocked<AuditService>;
    service = new AuthService(prisma, jwtService, configService, auditService);
    configService.get.mockImplementation((_key: string, defaultValue?: string | number) => defaultValue);
  });

  it('rejects admin role registration', async () => {
    await expect(
      service.register(
        {
          email: 'admin@example.com',
          password: 'Password123!',
          role: RoleType.ADMIN,
          countryId: 'country-id',
        },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects login with invalid password', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-id',
      email: 'patient@example.com',
      phone: null,
      passwordHash: 'hash',
      status: UserStatus.ACTIVE,
      role: RoleType.PATIENT,
      countryId: 'country-id',
      patient: { id: 'patient-id' },
      doctor: null,
      admin: null,
      deletedAt: null,
      regionId: null,
      cityId: null,
    } as never);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login(
        {
          identifier: 'patient@example.com',
          password: 'WrongPass123!',
        },
        {},
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects revoked refresh token', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'token-id',
      userId: 'user-id',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      revokedAt: new Date(),
      user: {
        id: 'user-id',
        email: 'patient@example.com',
        phone: null,
        passwordHash: 'hash',
        status: UserStatus.ACTIVE,
        role: RoleType.PATIENT,
        countryId: 'country-id',
        patient: { id: 'patient-id' },
        doctor: null,
        admin: null,
        deletedAt: null,
        regionId: null,
        cityId: null,
      },
    } as never);

    await expect(service.refresh({ refreshToken: 'token' }, {})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('creates OTP challenge for active user', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-id',
      email: 'patient@example.com',
      phone: '+23300000000',
      passwordHash: 'hash',
      status: UserStatus.ACTIVE,
      role: RoleType.PATIENT,
      countryId: 'country-id',
      patient: { id: 'patient-id' },
      doctor: null,
      admin: null,
      deletedAt: null,
    } as never);
    prisma.otpChallenge.create.mockResolvedValue({
      id: 'otp-id',
      userId: 'user-id',
      countryId: 'country-id',
    } as never);

    await expect(
      service.requestOtp({ identifier: 'patient@example.com', channel: OtpChannel.EMAIL }, {}),
    ).resolves.toEqual({ success: true, expiresInSeconds: 600 });
  });

  it('rejects invalid OTP code', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-id',
      email: 'patient@example.com',
      phone: '+23300000000',
      passwordHash: 'hash',
      status: UserStatus.ACTIVE,
      role: RoleType.PATIENT,
      countryId: 'country-id',
      patient: { id: 'patient-id' },
      doctor: null,
      admin: null,
      deletedAt: null,
    } as never);
    prisma.otpChallenge.findFirst.mockResolvedValue({
      id: 'otp-id',
      userId: 'user-id',
      channel: OtpChannel.EMAIL,
      purpose: 'LOGIN',
      destination: 'patient@example.com',
      codeHash: 'different',
      attempts: 0,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() + 1000 * 60),
      consumedAt: null,
    } as never);

    await expect(
      service.verifyOtp(
        { identifier: 'patient@example.com', channel: OtpChannel.EMAIL, code: '123456' },
        {},
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
