import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AppointmentStatus, AvailabilityType, RoleType, TimeSlotStatus } from '@prisma/client';

import { AuditService } from '../../../common/audit/audit.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AppointmentsService } from '../appointments.service';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let prisma: jest.Mocked<PrismaService>;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(() => {
    prisma = {
      availability: { create: jest.fn(), findFirst: jest.fn() },
      timeSlot: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      appointment: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      doctor: { findUnique: jest.fn() },
      doctorKycDocument: { count: jest.fn() },
      notification: { createMany: jest.fn() },
      $transaction: jest.fn(),
    } as unknown as jest.Mocked<PrismaService>;
    auditService = { logAction: jest.fn() } as unknown as jest.Mocked<AuditService>;
    service = new AppointmentsService(prisma, auditService);
  });

  it('books an appointment and reserves the slot', async () => {
    prisma.timeSlot.findFirst.mockResolvedValue({
      id: 'slot-id',
      doctorId: 'doctor-id',
      countryId: 'country-id',
      startTime: new Date(),
      endTime: new Date(Date.now() + 1000 * 60 * 30),
      timezone: 'Africa/Accra',
      status: TimeSlotStatus.AVAILABLE,
      doctor: { id: 'doctor-id', userId: 'doctor-user-id' },
    } as never);
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        appointment: {
          create: jest.fn().mockResolvedValue({ id: 'appointment-id' }),
        },
        timeSlot: {
          update: jest.fn(),
        },
      } as never),
    );
    prisma.notification.createMany.mockResolvedValue({ count: 2 } as never);

    await expect(
      service.bookAppointment(
        { id: 'user-id', role: RoleType.PATIENT, patientId: 'patient-id', countryId: 'country-id' },
        { timeSlotId: 'slot-id' },
        {},
      ),
    ).resolves.toEqual({ success: true, appointmentId: 'appointment-id' });
  });

  it('rejects reschedule when user lacks access', async () => {
    prisma.appointment.findFirst.mockResolvedValue({
      id: 'appointment-id',
      patientId: 'patient-id',
      doctorId: 'doctor-id',
      countryId: 'country-id',
      status: AppointmentStatus.SCHEDULED,
      timeSlotId: 'slot-id',
      notes: null,
      timeSlot: null,
      doctor: { id: 'doctor-id', userId: 'doctor-user-id' },
      patient: { id: 'patient-id', userId: 'patient-user-id' },
    } as never);

    await expect(
      service.rescheduleAppointment(
        { id: 'user-id', role: RoleType.PATIENT, patientId: 'other-patient', countryId: 'country-id' },
        'appointment-id',
        { timeSlotId: 'slot-id' },
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects invalid availability times', async () => {
    await expect(
      service.createAvailability(
        { id: 'user-id', role: RoleType.DOCTOR, doctorId: 'doctor-id', countryId: 'country-id' },
        {
          type: AvailabilityType.SPECIFIC_DATE,
          date: new Date(),
          startTime: new Date(Date.now() + 1000 * 60),
          endTime: new Date(),
          timezone: 'Africa/Accra',
        },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
