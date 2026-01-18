import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AppointmentStatus,
  AppointmentType,
  AuditAction,
  AvailabilityType,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  RoleType,
  TimeSlotStatus,
} from '@prisma/client';

import { AuditService } from '../../common/audit/audit.service';
import { CountryService } from '../../common/country/country.service';
import { AnalyticsService } from '../../common/observability/analytics.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { CreateTimeSlotDto } from './dto/create-timeslot.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly countryService: CountryService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async createAvailability(user: RequestUser, dto: CreateAvailabilityDto, meta: RequestMeta) {
    if (!user.doctorId) {
      throw new ForbiddenException('Doctor profile not found.');
    }
    if (dto.type === AvailabilityType.RECURRING && dto.dayOfWeek === undefined) {
      throw new BadRequestException('dayOfWeek is required for recurring availability.');
    }
    if (dto.type === AvailabilityType.SPECIFIC_DATE && !dto.date) {
      throw new BadRequestException('date is required for specific availability.');
    }
    if (dto.endTime <= dto.startTime) {
      throw new BadRequestException('Availability end time must be after start time.');
    }

    const availability = await this.prisma.availability.create({
      data: {
        doctorId: user.doctorId,
        countryId: user.countryId,
        type: dto.type,
        dayOfWeek: dto.dayOfWeek,
        date: dto.date,
        startTime: dto.startTime,
        endTime: dto.endTime,
        timezone: dto.timezone,
      },
    });

    await this.auditService.logAction({
      action: AuditAction.CREATE,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'Availability',
      entityId: availability.id,
      description: 'Doctor availability created.',
      meta,
    });

    return { success: true, availabilityId: availability.id };
  }

  async createTimeSlot(user: RequestUser, dto: CreateTimeSlotDto, meta: RequestMeta) {
    if (!user.doctorId) {
      throw new ForbiddenException('Doctor profile not found.');
    }
    if (dto.endTime <= dto.startTime) {
      throw new BadRequestException('Time slot end time must be after start time.');
    }

    const availability = await this.prisma.availability.findFirst({
      where: { id: dto.availabilityId, doctorId: user.doctorId, deletedAt: null },
      select: { id: true, startTime: true, endTime: true },
    });
    if (!availability) {
      throw new NotFoundException('Availability not found.');
    }
    if (dto.startTime < availability.startTime || dto.endTime > availability.endTime) {
      throw new BadRequestException('Time slot must fall within availability window.');
    }

    const overlapping = await this.prisma.timeSlot.findFirst({
      where: {
        doctorId: user.doctorId,
        deletedAt: null,
        startTime: { lt: dto.endTime },
        endTime: { gt: dto.startTime },
      },
      select: { id: true },
    });
    if (overlapping) {
      throw new BadRequestException('Time slot overlaps with an existing slot.');
    }

    const slot = await this.prisma.timeSlot.create({
      data: {
        availabilityId: availability.id,
        doctorId: user.doctorId,
        countryId: user.countryId,
        startTime: dto.startTime,
        endTime: dto.endTime,
        timezone: dto.timezone,
      },
    });

    await this.auditService.logAction({
      action: AuditAction.CREATE,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'TimeSlot',
      entityId: slot.id,
      description: 'Doctor time slot created.',
      meta,
    });

    return { success: true, timeSlotId: slot.id };
  }

  async bookAppointment(user: RequestUser, dto: BookAppointmentDto, meta: RequestMeta) {
    if (!user.patientId) {
      throw new ForbiddenException('Patient profile not found.');
    }

    const slot = await this.prisma.timeSlot.findFirst({
      where: {
        id: dto.timeSlotId,
        status: TimeSlotStatus.AVAILABLE,
        deletedAt: null,
      },
      include: {
        doctor: { select: { id: true, userId: true } },
      },
    });
    if (!slot) {
      throw new NotFoundException('Time slot not available.');
    }
    if (slot.countryId !== user.countryId) {
      throw new ForbiddenException('Time slot is not available in your country.');
    }

    const country = await this.countryService.getCountrySettings(user.countryId);

    const appointment = await this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          patientId: user.patientId,
          doctorId: slot.doctorId,
          timeSlotId: slot.id,
          countryId: user.countryId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          timezone: slot.timezone,
          currency: country.currency,
          type: dto.type ?? AppointmentType.IN_PERSON,
          status: AppointmentStatus.SCHEDULED,
          reason: dto.reason,
          notes: dto.notes,
        },
      });
      await tx.timeSlot.update({
        where: { id: slot.id },
        data: { status: TimeSlotStatus.BOOKED },
      });
      return appointment;
    });

    await this.createAppointmentNotifications({
      patientUserId: user.id,
      doctorUserId: slot.doctor.userId,
      countryId: user.countryId,
      title: 'Appointment booked',
      message: 'A new appointment has been scheduled.',
    });

    await this.auditService.logAction({
      action: AuditAction.CREATE,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'Appointment',
      entityId: appointment.id,
      description: 'Appointment booked.',
      meta,
    });
    this.analyticsService.track(
      'appointment_booked',
      { type: appointment.type },
      {
        userId: user.id,
        countryId: user.countryId,
        source: 'appointments.book',
      },
    );

    return { success: true, appointmentId: appointment.id };
  }

  async rescheduleAppointment(
    user: RequestUser,
    appointmentId: string,
    dto: RescheduleAppointmentDto,
    meta: RequestMeta,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, deletedAt: null },
      include: {
        timeSlot: true,
        doctor: { select: { id: true, userId: true } },
        patient: { select: { id: true, userId: true } },
      },
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found.');
    }
    this.assertAppointmentAccess(user, appointment.patientId, appointment.doctorId);
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled.');
    }
    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Completed appointments cannot be rescheduled.');
    }

    const slot = await this.prisma.timeSlot.findFirst({
      where: {
        id: dto.timeSlotId,
        status: TimeSlotStatus.AVAILABLE,
        doctorId: appointment.doctorId,
        deletedAt: null,
      },
    });
    if (!slot) {
      throw new NotFoundException('Requested time slot is not available.');
    }
    if (slot.countryId !== appointment.countryId) {
      throw new BadRequestException('Time slot country mismatch.');
    }

    await this.prisma.$transaction(async (tx) => {
      if (appointment.timeSlotId) {
        await tx.timeSlot.update({
          where: { id: appointment.timeSlotId },
          data: { status: TimeSlotStatus.AVAILABLE },
        });
      }
      await tx.timeSlot.update({
        where: { id: slot.id },
        data: { status: TimeSlotStatus.BOOKED },
      });
      await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          timeSlotId: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          timezone: slot.timezone,
          status: AppointmentStatus.SCHEDULED,
          notes: this.appendNote(appointment.notes, dto.reason, 'Rescheduled'),
        },
      });
    });

    await this.createAppointmentNotifications({
      patientUserId: appointment.patient.userId,
      doctorUserId: appointment.doctor.userId,
      countryId: appointment.countryId,
      title: 'Appointment rescheduled',
      message: 'The appointment time has been updated.',
    });

    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: user.id,
      countryId: appointment.countryId,
      entityType: 'Appointment',
      entityId: appointment.id,
      description: 'Appointment rescheduled.',
      meta,
    });
    this.analyticsService.track(
      'appointment_rescheduled',
      { appointmentId: appointment.id },
      {
        userId: user.id,
        countryId: appointment.countryId,
        source: 'appointments.reschedule',
      },
    );

    return { success: true };
  }

  async cancelAppointment(
    user: RequestUser,
    appointmentId: string,
    dto: CancelAppointmentDto,
    meta: RequestMeta,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, deletedAt: null },
      include: {
        timeSlot: true,
        doctor: { select: { id: true, userId: true } },
        patient: { select: { id: true, userId: true } },
      },
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found.');
    }
    this.assertAppointmentAccess(user, appointment.patientId, appointment.doctorId);
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled.');
    }

    await this.prisma.$transaction(async (tx) => {
      if (appointment.timeSlotId) {
        await tx.timeSlot.update({
          where: { id: appointment.timeSlotId },
          data: { status: TimeSlotStatus.AVAILABLE },
        });
      }
      await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: AppointmentStatus.CANCELLED,
          notes: this.appendNote(appointment.notes, dto.reason, 'Cancelled'),
        },
      });
    });

    await this.createAppointmentNotifications({
      patientUserId: appointment.patient.userId,
      doctorUserId: appointment.doctor.userId,
      countryId: appointment.countryId,
      title: 'Appointment cancelled',
      message: 'The appointment has been cancelled.',
    });

    await this.auditService.logAction({
      action: AuditAction.UPDATE,
      actorUserId: user.id,
      countryId: appointment.countryId,
      entityType: 'Appointment',
      entityId: appointment.id,
      description: 'Appointment cancelled.',
      meta,
    });
    this.analyticsService.track(
      'appointment_cancelled',
      { appointmentId: appointment.id },
      {
        userId: user.id,
        countryId: appointment.countryId,
        source: 'appointments.cancel',
      },
    );

    return { success: true };
  }

  private assertAppointmentAccess(user: RequestUser, patientId: string, doctorId: string) {
    if (user.role === RoleType.PATIENT && user.patientId !== patientId) {
      throw new ForbiddenException('Access denied.');
    }
    if (user.role === RoleType.DOCTOR && user.doctorId !== doctorId) {
      throw new ForbiddenException('Access denied.');
    }
  }

  private async createAppointmentNotifications(params: {
    patientUserId: string;
    doctorUserId: string;
    countryId: string;
    title: string;
    message: string;
  }) {
    await this.prisma.notification.createMany({
      data: [
        {
          userId: params.patientUserId,
          countryId: params.countryId,
          type: NotificationType.APPOINTMENT,
          channel: NotificationChannel.IN_APP,
          title: params.title,
          message: params.message,
          status: NotificationStatus.UNREAD,
        },
        {
          userId: params.doctorUserId,
          countryId: params.countryId,
          type: NotificationType.APPOINTMENT,
          channel: NotificationChannel.IN_APP,
          title: params.title,
          message: params.message,
          status: NotificationStatus.UNREAD,
        },
      ],
    });
  }

  private appendNote(existing: string | null, reason: string | undefined, prefix: string) {
    if (!reason) {
      return existing ?? undefined;
    }
    const note = `${prefix}: ${reason}`;
    if (!existing) {
      return note;
    }
    return `${existing}\n${note}`;
  }
}
