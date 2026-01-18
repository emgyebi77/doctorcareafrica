import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
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
import { EmergencyContactDto } from './dto/emergency-contact.dto';
import { MedicalHistoryDto } from './dto/medical-history.dto';
import { PhoneOtpRequestDto } from './dto/phone-otp-request.dto';
import { PhoneOtpVerifyDto } from './dto/phone-otp-verify.dto';
import { ProfileSetupDto } from './dto/profile-setup.dto';
import { PatientOnboardingService } from './patient-onboarding.service';

@Controller('patient-onboarding')
export class PatientOnboardingController {
  constructor(private readonly onboardingService: PatientOnboardingService) {}

  @Post('phone/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestPhoneOtp(
    @Body() dto: PhoneOtpRequestDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.onboardingService.requestPhoneOtp(dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('phone/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyPhoneOtp(
    @Body() dto: PhoneOtpVerifyDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.onboardingService.verifyPhoneOtp(dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Get('countries')
  async listCountries() {
    return this.onboardingService.listCountries();
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PATIENT)
  async setupProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: ProfileSetupDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.onboardingService.setupProfile(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch('emergency-contact')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PATIENT)
  async updateEmergencyContact(
    @CurrentUser() user: RequestUser,
    @Body() dto: EmergencyContactDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.onboardingService.updateEmergencyContact(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch('medical-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PATIENT)
  async updateMedicalHistory(
    @CurrentUser() user: RequestUser,
    @Body() dto: MedicalHistoryDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.onboardingService.updateMedicalHistory(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }
}
