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
import { CreateVideoSessionDto } from './dto/create-video-session.dto';
import { TelemedicineService } from './telemedicine.service';

@Controller('telemedicine')
export class TelemedicineController {
  constructor(private readonly telemedicineService: TelemedicineService) {}

  @Post('sessions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.DOCTOR, RoleType.PATIENT)
  @HttpCode(HttpStatus.OK)
  async createSession(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateVideoSessionDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.telemedicineService.createSession(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('sessions/:id/token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.DOCTOR, RoleType.PATIENT)
  @HttpCode(HttpStatus.OK)
  async generateToken(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) sessionId: string,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.telemedicineService.generateJoinToken(user, sessionId, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('sessions/:id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.DOCTOR)
  @HttpCode(HttpStatus.OK)
  async startSession(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) sessionId: string,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.telemedicineService.startSession(user, sessionId, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('sessions/:id/end')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.DOCTOR)
  @HttpCode(HttpStatus.OK)
  async endSession(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) sessionId: string,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.telemedicineService.endSession(user, sessionId, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Get('sessions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.DOCTOR, RoleType.PATIENT)
  async getSession(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) sessionId: string,
  ) {
    return this.telemedicineService.getSession(user, sessionId);
  }
}
