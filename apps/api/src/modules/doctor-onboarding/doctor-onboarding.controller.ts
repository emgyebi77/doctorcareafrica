import {
  Body,
  Controller,
  Get,
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
import { DoctorAvailabilityDto } from './dto/doctor-availability.dto';
import { DoctorDocumentDto } from './dto/doctor-document.dto';
import { DoctorOtpRequestDto } from './dto/doctor-otp-request.dto';
import { DoctorOtpVerifyDto } from './dto/doctor-otp-verify.dto';
import { DoctorProfileDto } from './dto/doctor-profile.dto';
import { DoctorReviewDto } from './dto/doctor-review.dto';
import { DoctorTimeSlotDto } from './dto/doctor-timeslot.dto';
import { DoctorOnboardingService } from './doctor-onboarding.service';

@Controller('doctor-onboarding')
export class DoctorOnboardingController {
  constructor(private readonly onboardingService: DoctorOnboardingService) {}

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() dto: DoctorOtpRequestDto, @Req() req: Request, @Ip() ip: string) {
    return this.onboardingService.requestOtp(dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: DoctorOtpVerifyDto, @Req() req: Request, @Ip() ip: string) {
    return this.onboardingService.verifyOtp(dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.DOCTOR)
  async updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: DoctorProfileDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.onboardingService.updateProfile(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.DOCTOR)
  @HttpCode(HttpStatus.OK)
  async uploadDocument(
    @CurrentUser() user: RequestUser,
    @Body() dto: DoctorDocumentDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.onboardingService.uploadDocument(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.DOCTOR)
  @HttpCode(HttpStatus.OK)
  async createAvailability(
    @CurrentUser() user: RequestUser,
    @Body() dto: DoctorAvailabilityDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.onboardingService.createAvailability(user, dto, {
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
    @Body() dto: DoctorTimeSlotDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.onboardingService.createTimeSlot(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.DOCTOR)
  @HttpCode(HttpStatus.OK)
  async submitOnboarding(
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.onboardingService.submitOnboarding(user, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  async listPending(@CurrentUser() user: RequestUser) {
    return this.onboardingService.listPending(user);
  }

  @Post('admin/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async approveOnboarding(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: DoctorReviewDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.onboardingService.approveOnboarding(user, id, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('admin/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async rejectOnboarding(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: DoctorReviewDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.onboardingService.rejectOnboarding(user, id, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('admin/documents/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async approveDocument(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: DoctorReviewDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.onboardingService.approveDocument(user, id, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('admin/documents/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async rejectDocument(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: DoctorReviewDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.onboardingService.rejectDocument(user, id, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }
}
