import { Global, Module } from '@nestjs/common';

import { AnalyticsService } from './analytics.service';
import { LoggingMiddleware } from './logging.middleware';
import { MetricsService } from './metrics.service';
import { StructuredLogger } from './structured-logger.service';
import { TraceService } from './trace.service';

@Global()
@Module({
  providers: [StructuredLogger, MetricsService, TraceService, AnalyticsService, LoggingMiddleware],
  exports: [StructuredLogger, MetricsService, TraceService, AnalyticsService, LoggingMiddleware],
})
export class ObservabilityModule {}
