import { Injectable, Logger } from '@nestjs/common';
import { AuditAction } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

interface AuditMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logAction(params: {
    action: AuditAction;
    actorUserId?: string;
    countryId?: string;
    entityType: string;
    entityId: string;
    description?: string;
    meta?: AuditMeta;
    metadata?: Record<string, unknown>;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: params.action,
          actorUserId: params.actorUserId,
          countryId: params.countryId,
          entityType: params.entityType,
          entityId: params.entityId,
          description: params.description,
          ipAddress: params.meta?.ipAddress,
          userAgent: params.meta?.userAgent,
          metadata: params.metadata,
        },
      });
    } catch (error) {
      this.logger.warn(`Audit log failed: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }
}
