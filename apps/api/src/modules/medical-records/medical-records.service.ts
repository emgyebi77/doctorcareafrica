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
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class MedicalRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getMedicalRecord(user: RequestUser, patientId: string) {
    await this.assertMedicalAccess(user, patientId);

    const record = await this.prisma.medicalRecord.findFirst({
      where: { patientId, deletedAt: null },
      include: {
        encounters: {
          where: { deletedAt: null },
          orderBy: { occurredAt: 'desc' },
        },
        attachments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!record) {
      throw new NotFoundException('Medical record not found.');
    }

    return { record };
  }

  async createEncounter(user: RequestUser, dto: CreateEncounterDto, meta: RequestMeta) {
    if (!user.doctorId) {
      throw new ForbiddenException('Doctor profile not found.');
    }
    await this.assertMedicalAccess(user, dto.patientId);

    const record = await this.ensureMedicalRecord(dto.patientId, user.countryId);
    const encounter = await this.prisma.encounter.create({
      data: {
        medicalRecordId: record.id,
        patientId: dto.patientId,
        doctorId: user.doctorId,
        appointmentId: dto.appointmentId,
        countryId: user.countryId,
        occurredAt: dto.occurredAt,
        chiefComplaint: dto.chiefComplaint,
        diagnosis: dto.diagnosis,
        notes: dto.notes,
      },
    });

    await this.auditService.logAction({
      action: AuditAction.CREATE,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'Encounter',
      entityId: encounter.id,
      description: 'Encounter created.',
      meta,
    });

    return { success: true, encounterId: encounter.id };
  }

  async createPrescription(user: RequestUser, dto: CreatePrescriptionDto, meta: RequestMeta) {
    if (!user.doctorId) {
      throw new ForbiddenException('Doctor profile not found.');
    }

    const encounter = await this.prisma.encounter.findFirst({
      where: { id: dto.encounterId, deletedAt: null },
      select: { id: true, patientId: true, countryId: true },
    });
    if (!encounter) {
      throw new NotFoundException('Encounter not found.');
    }
    await this.assertMedicalAccess(user, encounter.patientId);

    const prescription = await this.prisma.prescription.create({
      data: {
        encounterId: encounter.id,
        patientId: encounter.patientId,
        doctorId: user.doctorId,
        countryId: encounter.countryId,
        medicationName: dto.medicationName,
        dosage: dto.dosage,
        frequency: dto.frequency,
        durationDays: dto.durationDays,
        instructions: dto.instructions,
      },
    });

    await this.auditService.logAction({
      action: AuditAction.CREATE,
      actorUserId: user.id,
      countryId: encounter.countryId,
      entityType: 'Prescription',
      entityId: prescription.id,
      description: 'Prescription created.',
      meta,
    });

    return { success: true, prescriptionId: prescription.id };
  }

  async createAttachment(user: RequestUser, dto: CreateAttachmentDto, meta: RequestMeta) {
    const target = await this.resolveAttachmentTarget(user, dto);

    const attachment = await this.prisma.attachment.create({
      data: {
        medicalRecordId: target.medicalRecordId,
        encounterId: target.encounterId,
        prescriptionId: target.prescriptionId,
        uploadedByUserId: user.id,
        countryId: target.countryId,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        checksum: dto.checksum,
        storageProvider: dto.storageProvider,
      },
    });

    await this.auditService.logAction({
      action: AuditAction.CREATE,
      actorUserId: user.id,
      countryId: target.countryId,
      entityType: 'Attachment',
      entityId: attachment.id,
      description: 'Attachment uploaded.',
      meta,
    });

    return { success: true, attachmentId: attachment.id };
  }

  private async resolveAttachmentTarget(user: RequestUser, dto: CreateAttachmentDto) {
    if (dto.encounterId) {
      const encounter = await this.prisma.encounter.findFirst({
        where: { id: dto.encounterId, deletedAt: null },
        select: { medicalRecordId: true, patientId: true, countryId: true },
      });
      if (!encounter) {
        throw new NotFoundException('Encounter not found.');
      }
      await this.assertMedicalAccess(user, encounter.patientId);
      return {
        medicalRecordId: encounter.medicalRecordId,
        encounterId: dto.encounterId,
        prescriptionId: null,
        countryId: encounter.countryId,
      };
    }

    if (dto.prescriptionId) {
      const prescription = await this.prisma.prescription.findFirst({
        where: { id: dto.prescriptionId, deletedAt: null },
        select: { encounterId: true, patientId: true, countryId: true },
      });
      if (!prescription) {
        throw new NotFoundException('Prescription not found.');
      }
      await this.assertMedicalAccess(user, prescription.patientId);
      return {
        medicalRecordId: null,
        encounterId: prescription.encounterId,
        prescriptionId: dto.prescriptionId,
        countryId: prescription.countryId,
      };
    }

    if (dto.medicalRecordId) {
      const record = await this.prisma.medicalRecord.findFirst({
        where: { id: dto.medicalRecordId, deletedAt: null },
        select: { id: true, patientId: true, countryId: true },
      });
      if (!record) {
        throw new NotFoundException('Medical record not found.');
      }
      await this.assertMedicalAccess(user, record.patientId);
      return {
        medicalRecordId: record.id,
        encounterId: null,
        prescriptionId: null,
        countryId: record.countryId,
      };
    }

    if (dto.patientId) {
      await this.assertMedicalAccess(user, dto.patientId);
      const record = await this.ensureMedicalRecord(dto.patientId, user.countryId);
      return {
        medicalRecordId: record.id,
        encounterId: null,
        prescriptionId: null,
        countryId: record.countryId,
      };
    }

    throw new BadRequestException('Attachment target is required.');
  }

  private async ensureMedicalRecord(patientId: string, countryId: string) {
    return this.prisma.medicalRecord.upsert({
      where: { patientId },
      update: {},
      create: { patientId, countryId },
    });
  }

  private async assertMedicalAccess(user: RequestUser, patientId: string) {
    if (user.role === RoleType.PATIENT) {
      if (user.patientId !== patientId) {
        throw new ForbiddenException('Access denied.');
      }
      return;
    }
    if (user.role === RoleType.DOCTOR) {
      const relationship = await this.prisma.appointment.findFirst({
        where: { patientId, doctorId: user.doctorId, deletedAt: null },
        select: { id: true },
      });
      if (!relationship) {
        throw new ForbiddenException('Access denied.');
      }
      return;
    }
    if (user.role === RoleType.ADMIN || user.role === RoleType.SUPER_ADMIN) {
      return;
    }
    throw new ForbiddenException('Access denied.');
  }
}
