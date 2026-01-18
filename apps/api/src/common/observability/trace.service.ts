import { Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';

export type TraceSpan = {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startedAt: number;
  attributes?: Record<string, unknown>;
};

@Injectable()
export class TraceService {
  startSpan(
    name: string,
    options?: {
      traceId?: string;
      parentSpanId?: string;
      attributes?: Record<string, unknown>;
    },
  ): TraceSpan {
    return {
      traceId: options?.traceId ?? randomUUID(),
      spanId: randomBytes(8).toString('hex'),
      parentSpanId: options?.parentSpanId,
      name,
      startedAt: Date.now(),
      attributes: options?.attributes,
    };
  }

  endSpan(span: TraceSpan) {
    return {
      ...span,
      durationMs: Date.now() - span.startedAt,
    };
  }
}
