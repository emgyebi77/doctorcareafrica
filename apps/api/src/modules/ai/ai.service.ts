import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction, RoleType } from '@prisma/client';

import { AuditService } from '../../common/audit/audit.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { AI_TEMPLATES, AiFeature } from './ai.templates';
import { validateSafety } from './ai.safety';
import { AiEducationDto } from './dto/ai-education.dto';
import { AiFollowUpDto } from './dto/ai-followup.dto';
import { AiLogQueryDto } from './dto/ai-log-query.dto';
import { AiSummaryDto } from './dto/ai-summary.dto';
import { AiTranslateDto } from './dto/ai-translate.dto';
import { AiTriageDto } from './dto/ai-triage.dto';

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  async triage(user: RequestUser, dto: AiTriageDto, meta: RequestMeta) {
    return this.generate(user, 'triage', AI_TEMPLATES.triage(dto), meta);
  }

  async summary(user: RequestUser, dto: AiSummaryDto, meta: RequestMeta) {
    return this.generate(user, 'summary', AI_TEMPLATES.summary(dto), meta);
  }

  async followup(user: RequestUser, dto: AiFollowUpDto, meta: RequestMeta) {
    return this.generate(user, 'followup', AI_TEMPLATES.followup(dto), meta);
  }

  async education(user: RequestUser, dto: AiEducationDto, meta: RequestMeta) {
    return this.generate(user, 'education', AI_TEMPLATES.education(dto), meta);
  }

  async translate(user: RequestUser, dto: AiTranslateDto, meta: RequestMeta) {
    return this.generate(user, 'translate', AI_TEMPLATES.translate(dto), meta);
  }

  async listLogs(user: RequestUser, query: AiLogQueryDto) {
    if (user.role !== RoleType.ADMIN && user.role !== RoleType.SUPER_ADMIN) {
      throw new ForbiddenException('Admin access required.');
    }
    const logs = await this.prisma.aiLog.findMany({
      where: {
        userId: query.userId,
        patientId: query.patientId,
        doctorId: query.doctorId,
        encounterId: query.encounterId,
        metadata: query.feature ? { path: ['feature'], equals: query.feature } : undefined,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { logs };
  }

  private async generate(
    user: RequestUser,
    feature: AiFeature,
    prompt: string,
    meta: RequestMeta,
  ) {
    const safety = validateSafety(prompt);
    if (!safety.allowed) {
      throw new BadRequestException(safety.reason ?? 'Unsafe content.');
    }

    const model = this.configService.get<string>('AI_MODEL', 'mock-model');
    const provider = this.configService.get<string>('AI_PROVIDER', 'mock');
    const response = this.mockResponse(feature);
    const inputTokens = this.countTokens(prompt);
    const outputTokens = this.countTokens(response);

    const log = await this.prisma.aiLog.create({
      data: {
        userId: user.id,
        patientId: user.patientId ?? undefined,
        doctorId: user.doctorId ?? undefined,
        countryId: user.countryId,
        model,
        prompt,
        response,
        inputTokens,
        outputTokens,
        metadata: {
          feature,
          provider,
          safety: safety.reason ?? null,
        },
      },
    });

    await this.auditService.logAction({
      action: AuditAction.CREATE,
      actorUserId: user.id,
      countryId: user.countryId,
      entityType: 'AiLog',
      entityId: log.id,
      description: `AI ${feature} generated.`,
      meta,
    });

    return { response, logId: log.id };
  }

  private mockResponse(feature: AiFeature) {
    return `AI ${feature} response placeholder.`;
  }

  private countTokens(text: string) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }
}
