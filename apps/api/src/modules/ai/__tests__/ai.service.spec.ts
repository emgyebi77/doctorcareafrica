import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoleType } from '@prisma/client';

import { AuditService } from '../../../common/audit/audit.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AiService } from '../ai.service';

describe('AiService', () => {
  let service: AiService;
  let prisma: jest.Mocked<PrismaService>;
  let auditService: jest.Mocked<AuditService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    prisma = {
      aiLog: { create: jest.fn(), findMany: jest.fn() },
    } as unknown as jest.Mocked<PrismaService>;
    auditService = { logAction: jest.fn() } as unknown as jest.Mocked<AuditService>;
    configService = { get: jest.fn() } as unknown as jest.Mocked<ConfigService>;
    configService.get.mockImplementation((_key: string, defaultValue?: string | number) => defaultValue);
    service = new AiService(prisma, auditService, configService);
  });

  it('rejects unsafe input', async () => {
    await expect(
      service.triage(
        { id: 'user-id', role: RoleType.PATIENT, patientId: 'patient-id', countryId: 'country-id' },
        { symptoms: 'I want to kill myself' },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('logs AI response', async () => {
    prisma.aiLog.create.mockResolvedValue({ id: 'log-id' } as never);

    await expect(
      service.summary(
        { id: 'user-id', role: RoleType.DOCTOR, doctorId: 'doctor-id', countryId: 'country-id' },
        { notes: 'Patient feels better today.' },
        {},
      ),
    ).resolves.toEqual({ response: 'AI summary response placeholder.', logId: 'log-id' });
  });

  it('returns non-diagnostic symptom guidance', async () => {
    prisma.aiLog.create.mockResolvedValue({ id: 'log-id' } as never);

    await expect(
      service.symptomGuidance(
        { id: 'user-id', role: RoleType.PATIENT, patientId: 'patient-id', countryId: 'country-id' },
        { symptoms: 'Mild headache', duration: '1 day' },
        {},
      ),
    ).resolves.toEqual({
      response: 'This is general guidance and not a diagnosis. Seek urgent care if symptoms worsen.',
      logId: 'log-id',
    });
  });

  it('returns specialty routing guidance', async () => {
    prisma.aiLog.create.mockResolvedValue({ id: 'log-id' } as never);

    await expect(
      service.specialtyRouting(
        { id: 'user-id', role: RoleType.PATIENT, patientId: 'patient-id', countryId: 'country-id' },
        { symptoms: 'Chest pain with exertion', age: 45 },
        {},
      ),
    ).resolves.toEqual({
      response: 'Recommended specialty: General Medicine. This is not a diagnosis.',
      logId: 'log-id',
    });
  });

  it('returns notes assistant response', async () => {
    prisma.aiLog.create.mockResolvedValue({ id: 'log-id' } as never);

    await expect(
      service.notesAssistant(
        { id: 'user-id', role: RoleType.DOCTOR, doctorId: 'doctor-id', countryId: 'country-id' },
        { notes: 'Patient reports dizziness, vitals stable.' },
        {},
      ),
    ).resolves.toEqual({
      response: 'Drafted clinical note (non-diagnostic): Subjective, Objective, Assessment, Plan.',
      logId: 'log-id',
    });
  });

  it('blocks log access for non-admin', async () => {
    await expect(
      service.listLogs(
        { id: 'user-id', role: RoleType.PATIENT, patientId: 'patient-id', countryId: 'country-id' },
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('flags prescribing requests in safety check', async () => {
    prisma.aiLog.create.mockResolvedValue({ id: 'log-id' } as never);

    await expect(
      service.safetyCheck(
        { id: 'user-id', role: RoleType.DOCTOR, doctorId: 'doctor-id', countryId: 'country-id' },
        { content: 'Please prescribe antibiotics for sore throat.' },
        {},
      ),
    ).resolves.toEqual({ allowed: false, reason: 'Prescribing requests are not allowed.' });
  });

  it('returns patient chat guidance', async () => {
    prisma.aiLog.create.mockResolvedValue({ id: 'log-id' } as never);

    await expect(
      service.patientChat(
        { id: 'user-id', role: RoleType.PATIENT, patientId: 'patient-id', countryId: 'country-id' },
        { message: 'I have a mild cough.' },
        {},
      ),
    ).resolves.toEqual({
      response:
        'I can provide general guidance, but I cannot diagnose or prescribe. If symptoms worsen, seek care.',
      logId: 'log-id',
    });
  });

  it('returns risk score for admin', async () => {
    prisma.aiLog.create.mockResolvedValue({ id: 'log-id' } as never);

    await expect(
      service.riskScore(
        { id: 'admin-id', role: RoleType.ADMIN, countryId: 'country-id' },
        { subject: 'Patient A', factors: ['missed appointments', 'unpaid balance'] },
        {},
      ),
    ).resolves.toEqual({
      response: 'Risk score: 55. Rationale: Moderate risk based on factors provided.',
      logId: 'log-id',
    });
  });
});
