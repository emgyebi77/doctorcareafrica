import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Query,
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
import { AiService } from './ai.service';
import { AiEducationDto } from './dto/ai-education.dto';
import { AiFollowUpDto } from './dto/ai-followup.dto';
import { AiLogQueryDto } from './dto/ai-log-query.dto';
import { AiSpecialtyRoutingDto } from './dto/ai-specialty-routing.dto';
import { AiSummaryDto } from './dto/ai-summary.dto';
import { AiTranslateDto } from './dto/ai-translate.dto';
import { AiSymptomGuidanceDto } from './dto/ai-symptom-guidance.dto';
import { AiTriageDto } from './dto/ai-triage.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('triage')
  @Roles(RoleType.PATIENT, RoleType.DOCTOR, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async triage(
    @CurrentUser() user: RequestUser,
    @Body() dto: AiTriageDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.aiService.triage(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('symptom-guidance')
  @Roles(RoleType.PATIENT, RoleType.DOCTOR, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async symptomGuidance(
    @CurrentUser() user: RequestUser,
    @Body() dto: AiSymptomGuidanceDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.aiService.symptomGuidance(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('summary')
  @Roles(RoleType.PATIENT, RoleType.DOCTOR, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async summary(
    @CurrentUser() user: RequestUser,
    @Body() dto: AiSummaryDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.aiService.summary(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('specialty-routing')
  @Roles(RoleType.PATIENT, RoleType.DOCTOR, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async specialtyRouting(
    @CurrentUser() user: RequestUser,
    @Body() dto: AiSpecialtyRoutingDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.aiService.specialtyRouting(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('followup')
  @Roles(RoleType.PATIENT, RoleType.DOCTOR, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async followup(
    @CurrentUser() user: RequestUser,
    @Body() dto: AiFollowUpDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.aiService.followup(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('education')
  @Roles(RoleType.PATIENT, RoleType.DOCTOR, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async education(
    @CurrentUser() user: RequestUser,
    @Body() dto: AiEducationDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.aiService.education(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Post('translate')
  @Roles(RoleType.PATIENT, RoleType.DOCTOR, RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async translate(
    @CurrentUser() user: RequestUser,
    @Body() dto: AiTranslateDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    return this.aiService.translate(user, dto, {
      ipAddress: ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
  }

  @Get('logs')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  async logs(@CurrentUser() user: RequestUser, @Query() query: AiLogQueryDto) {
    return this.aiService.listLogs(user, query);
  }
}
