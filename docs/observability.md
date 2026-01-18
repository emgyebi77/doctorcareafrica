# Observability and Analytics

This document describes logging, metrics, tracing, and analytics events.

## Structured logs

Structured logs are emitted as JSON to stdout using `StructuredLogger`.

Example fields:
- `timestamp`, `level`, `message`, `context`
- `meta` (object with request or event attributes)

## Logging middleware

`LoggingMiddleware` runs for all API requests and emits a structured log entry per response.

Logged fields include:
- `requestId` (`x-request-id` propagated)
- `traceId` (`x-trace-id` propagated or generated)
- `spanId`
- `method`, `path`, `statusCode`
- `durationMs`, `traceDurationMs`
- `ip`, `userAgent`

## Metrics

In-memory metrics are tracked in `MetricsService`.

Current metrics:
- `http_requests_total` (labels: `method`, `status`, `path`)
- `http_request_duration_ms` (labels: `method`, `status`, `path`)
- `analytics_events_total` (labels: `event`)

## Tracing outline

`TraceService` generates trace and span identifiers and records basic timing.

Future integration plan:
- Replace `TraceService` with OpenTelemetry SDK.
- Export traces to an OTLP collector.
- Propagate `traceparent` headers across services.
- Attach trace/span IDs to logs for correlation.

## Analytics events

Analytics events are emitted via `AnalyticsService` and logged as structured JSON.

Events:
- `user_registered` (payload: `role`)
- `user_login` (payload: `method`)
- `appointment_booked` (payload: `type`)
- `appointment_rescheduled` (payload: `appointmentId`)
- `appointment_cancelled` (payload: `appointmentId`)
- `payment_initiated` (payload: `provider`, `amount`, `currency`, `appointmentId`)
