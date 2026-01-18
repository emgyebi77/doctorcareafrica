import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
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
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { MedicalRecordsService } from './medical-records.service';

@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Get(':patientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PATIENT, RoleType.DOCTOR, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  async getRecord(
    @CurrentUser() user: RequestUser,
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
  ) {
    return this.medicalRecordsService.getMedicalRecord(user, patientId);
  }

  @Post('encounters')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.DOCTOR, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async createEncounter(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateEncounterDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.medicalRecordsService.createEncounter(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('prescriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.DOCTOR, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async createPrescription(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreatePrescriptionDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.medicalRecordsService.createPrescription(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('attachments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.DOCTOR, RoleType.PATIENT, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async createAttachment(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateAttachmentDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.medicalRecordsService.createAttachment(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }
}
