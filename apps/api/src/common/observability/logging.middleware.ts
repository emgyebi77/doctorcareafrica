import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

import { MetricsService } from './metrics.service';
import { StructuredLogger } from './structured-logger.service';
import { TraceService } from './trace.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(
    private readonly logger: StructuredLogger,
    private readonly metrics: MetricsService,
    private readonly traceService: TraceService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.get('x-request-id') ?? randomUUID();
    const traceId = req.get('x-trace-id') ?? undefined;
    const span = this.traceService.startSpan('http.request', {
      traceId,
      attributes: {
        method: req.method,
        path: this.path(req),
      },
    });
    const start = process.hrtime.bigint();

    res.setHeader('x-request-id', requestId);
    res.setHeader('x-trace-id', span.traceId);

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      const statusCode = res.statusCode;
      const path = this.path(req);
      const spanResult = this.traceService.endSpan(span);

      this.metrics.increment('http_requests_total', {
        method: req.method,
        status: statusCode,
        path,
      });
      this.metrics.observe('http_request_duration_ms', durationMs, {
        method: req.method,
        status: statusCode,
        path,
      });

      this.logger.logWithMeta(
        'info',
        'http_request',
        {
          requestId,
          traceId: span.traceId,
          spanId: span.spanId,
          method: req.method,
          path,
          statusCode,
          durationMs,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          traceDurationMs: spanResult.durationMs,
        },
        LoggingMiddleware.name,
      );
    });

    next();
  }

  private path(req: Request) {
    return req.originalUrl.split('?')[0];
  }
}
