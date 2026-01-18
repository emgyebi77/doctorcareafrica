import { Injectable } from '@nestjs/common';

import { MetricsService } from './metrics.service';
import { StructuredLogger } from './structured-logger.service';

type AnalyticsMeta = {
  userId?: string;
  countryId?: string;
  source?: string;
  traceId?: string;
};

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly logger: StructuredLogger,
    private readonly metrics: MetricsService,
  ) {}

  track(event: string, payload: Record<string, unknown>, meta?: AnalyticsMeta) {
    this.metrics.increment('analytics_events_total', { event });
    this.logger.logWithMeta(
      'info',
      'analytics_event',
      {
        event,
        payload,
        meta,
      },
      AnalyticsService.name,
    );
  }
}
