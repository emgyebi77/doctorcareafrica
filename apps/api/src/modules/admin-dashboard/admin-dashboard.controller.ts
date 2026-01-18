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
import { DoctorReviewDto } from '../doctor-onboarding/dto/doctor-review.dto';
import { AdminDashboardService } from './admin-dashboard.service';
import { CreateCityDto } from './dto/create-city.dto';
import { CreateCountryDto } from './dto/create-country.dto';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
export class AdminDashboardController {
  constructor(private readonly adminService: AdminDashboardService) {}

  @Get('users')
  async listUsers() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id/status')
  @HttpCode(HttpStatus.OK)
  async updateUserStatus(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.adminService.updateUserStatus(user, id, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Get('doctors/pending')
  async listDoctorApprovals(@CurrentUser() user: RequestUser) {
    return this.adminService.listDoctorApprovals(user);
  }

  @Post('doctors/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveDoctor(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: DoctorReviewDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.adminService.approveDoctor(user, id, dto.notes, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('doctors/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectDoctor(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: DoctorReviewDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.adminService.rejectDoctor(user, id, dto.notes, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Get('appointments')
  async listAppointments(@CurrentUser() user: RequestUser) {
    return this.adminService.listAppointments(user);
  }

  @Get('payments')
  async listPayments(@CurrentUser() user: RequestUser) {
    return this.adminService.listPayments(user);
  }

  @Get('countries')
  async listCountries(@CurrentUser() user: RequestUser) {
    return this.adminService.listCountries(user);
  }

  @Post('countries')
  @HttpCode(HttpStatus.OK)
  async createCountry(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateCountryDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.adminService.createCountry(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch('countries/:id')
  @HttpCode(HttpStatus.OK)
  async updateCountry(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCountryDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.adminService.updateCountry(user, id, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('regions')
  @HttpCode(HttpStatus.OK)
  async createRegion(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateRegionDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.adminService.createRegion(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch('regions/:id')
  @HttpCode(HttpStatus.OK)
  async updateRegion(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRegionDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.adminService.updateRegion(user, id, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('cities')
  @HttpCode(HttpStatus.OK)
  async createCity(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateCityDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.adminService.createCity(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Patch('cities/:id')
  @HttpCode(HttpStatus.OK)
  async updateCity(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCityDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.adminService.updateCity(user, id, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Get('analytics')
  async analytics(@CurrentUser() user: RequestUser) {
    return this.adminService.analytics(user);
  }
}
