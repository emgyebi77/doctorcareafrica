import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { RoleType } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AppointmentsService } from './appointments.service';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { CreateTimeSlotDto } from './dto/create-timeslot.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post('availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.DOCTOR)
  @HttpCode(HttpStatus.OK)
  async createAvailability(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateAvailabilityDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.appointmentsService.createAvailability(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('time-slots')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.DOCTOR)
  @HttpCode(HttpStatus.OK)
  async createTimeSlot(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateTimeSlotDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.appointmentsService.createTimeSlot(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PATIENT)
  @HttpCode(HttpStatus.OK)
  async bookAppointment(
    @CurrentUser() user: RequestUser,
    @Body() dto: BookAppointmentDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.appointmentsService.bookAppointment(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch(':id/reschedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PATIENT, RoleType.DOCTOR)
  @HttpCode(HttpStatus.OK)
  async rescheduleAppointment(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) appointmentId: string,
    @Body() dto: RescheduleAppointmentDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.appointmentsService.rescheduleAppointment(user, appointmentId, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PATIENT, RoleType.DOCTOR)
  @HttpCode(HttpStatus.OK)
  async cancelAppointment(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) appointmentId: string,
    @Body() dto: CancelAppointmentDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.appointmentsService.cancelAppointment(user, appointmentId, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }
}
