import { ForbiddenException } from '@nestjs/common';
import { RoleType } from '@prisma/client';

import { AuditService } from '../../../common/audit/audit.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { MedicalRecordsService } from '../medical-records.service';

describe('MedicalRecordsService', () => {
  let service: MedicalRecordsService;
  let prisma: jest.Mocked<PrismaService>;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(() => {
    prisma = {
      medicalRecord: { findFirst: jest.fn(), upsert: jest.fn() },
      encounter: { create: jest.fn(), findFirst: jest.fn() },
      prescription: { create: jest.fn(), findFirst: jest.fn() },
      attachment: { create: jest.fn() },
      appointment: { findFirst: jest.fn() },
    } as unknown as jest.Mocked<PrismaService>;
    auditService = { logAction: jest.fn() } as unknown as jest.Mocked<AuditService>;
    service = new MedicalRecordsService(prisma, auditService);
  });

  it('blocks patient access to another patient record', async () => {
    await expect(
      service.getMedicalRecord(
        { id: 'user-id', role: RoleType.PATIENT, patientId: 'patient-a', countryId: 'country-id' },
        'patient-b',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates encounter for doctor', async () => {
    prisma.appointment.findFirst.mockResolvedValue({ id: 'appt-id' } as never);
    prisma.medicalRecord.upsert.mockResolvedValue({ id: 'record-id' } as never);
    prisma.encounter.create.mockResolvedValue({ id: 'encounter-id' } as never);

    await expect(
      service.createEncounter(
        { id: 'doctor-user', role: RoleType.DOCTOR, doctorId: 'doctor-id', countryId: 'country-id' },
        {
          patientId: 'patient-id',
          occurredAt: new Date(),
          notes: 'Follow-up',
        },
        {},
      ),
    ).resolves.toEqual({ success: true, encounterId: 'encounter-id' });
  });
});
