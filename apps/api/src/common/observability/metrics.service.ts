import { Injectable } from '@nestjs/common';

type Labels = Record<string, string | number>;

@Injectable()
export class MetricsService {
  private readonly counters = new Map<string, number>();
  private readonly observations = new Map<string, number[]>();

  increment(name: string, labels?: Labels) {
    const key = this.key(name, labels);
    const current = this.counters.get(key) ?? 0;
    this.counters.set(key, current + 1);
  }

  observe(name: string, value: number, labels?: Labels) {
    const key = this.key(name, labels);
    const existing = this.observations.get(key) ?? [];
    existing.push(value);
    this.observations.set(key, existing);
  }

  snapshot() {
    return {
      counters: Array.from(this.counters.entries()).map(([key, value]) => ({ key, value })),
      observations: Array.from(this.observations.entries()).map(([key, values]) => ({
        key,
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((sum, v) => sum + v, 0) / values.length,
      })),
    };
  }

  private key(name: string, labels?: Labels) {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    return `${name}:${JSON.stringify(labels)}`;
  }
}
