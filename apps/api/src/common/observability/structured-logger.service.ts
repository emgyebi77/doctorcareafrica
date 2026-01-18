import { Injectable, LoggerService } from '@nestjs/common';

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'verbose';

@Injectable()
export class StructuredLogger implements LoggerService {
  log(message: string, context?: string) {
    this.write('info', message, undefined, context);
  }

  warn(message: string, context?: string) {
    this.write('warn', message, undefined, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.write('error', message, trace ? { trace } : undefined, context);
  }

  debug(message: string, context?: string) {
    this.write('debug', message, undefined, context);
  }

  verbose(message: string, context?: string) {
    this.write('verbose', message, undefined, context);
  }

  logWithMeta(level: LogLevel, message: string, meta?: Record<string, unknown>, context?: string) {
    this.write(level, message, meta, context);
  }

  private write(level: LogLevel, message: string, meta?: Record<string, unknown>, context?: string) {
    const payload: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };
    if (context) {
      payload.context = context;
    }
    if (meta && Object.keys(meta).length > 0) {
      payload.meta = meta;
    }
    console.log(JSON.stringify(payload));
  }
}
