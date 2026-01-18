# Doctor Care Africa - System Architecture

This document defines the full system architecture for Doctor Care Africa using
Next.js, NestJS, PostgreSQL + Prisma, JWT auth, multi-country support, Jitsi,
and an AI engine.

## 1) Folder structure (frontend + backend)

Repository layout (monorepo-style):
- `apps/`
  - `web/` (Next.js frontend)
  - `api/` (NestJS backend)
- `packages/`
  - `db/` (Prisma schema, migrations, generated client)
  - `shared/` (types, validation schemas, constants)
  - `ui/` (shared UI components)
- `docs/` (architecture, schema, runbooks)
- `infra/` (deployment manifests, scripts, Terraform if needed)

Next.js (`apps/web/`) key folders:
- `app/` (App Router, route segments)
- `components/` (UI components)
- `features/` (feature-focused UI and hooks)
- `lib/` (API clients, auth helpers, utilities)
- `public/` (static assets)

NestJS (`apps/api/`) key folders:
- `src/`
  - `modules/`
    - `auth/`, `users/`, `patients/`, `doctors/`, `admin/`
    - `geo/` (country, region, city)
    - `availability/`, `appointments/`
    - `payments/`, `wallets/`, `transactions/`
    - `medical-records/`, `encounters/`, `prescriptions/`, `attachments/`
    - `notifications/`, `audit-logs/`
    - `video/` (Jitsi sessions, tokens)
    - `ai/` (AI orchestration, logs)
  - `common/` (guards, interceptors, pipes, filters)
  - `config/` (env, feature flags, country config)
  - `jobs/` (queues, cron)
  - `main.ts` (bootstrap)

## 2) Database schema overview

The schema is managed via Prisma and reuses the global entities in
`prisma/schema.prisma`. Key themes:
- Core identity: `User` with 1:1 profiles `Patient`, `Doctor`, `Admin`.
- Geography: `Country`, `Region`, `City` with references on business entities.
- Scheduling: `Availability`, `TimeSlot`, `Appointment`.
- Care delivery: `MedicalRecord`, `Encounter`, `Prescription`, `Attachment`.
- Financials: `Wallet`, `Payment`, `Transaction`.
- Communication and governance: `Notification`, `AuditLog`.
- Telemedicine: `VideoSession`, `VideoToken`.
- AI observability: `AiLog`.

All business entities include `createdAt`, `updatedAt`, and `deletedAt` where
soft deletes are required, plus indexes on common filter columns.

## 3) API route map

Base path: `/api/v1`

Auth and users
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /users/me`
- `PATCH /users/me`

Patient and doctor
- `GET /patients/:id`
- `PATCH /patients/:id`
- `GET /doctors`
- `GET /doctors/:id`
- `PATCH /doctors/:id`

Admin
- `GET /admin/users`
- `PATCH /admin/users/:id/status`
- `GET /admin/audit-logs`

Geo
- `GET /geo/countries`
- `GET /geo/regions?countryId=`
- `GET /geo/cities?regionId=`

Availability and appointments
- `POST /availability`
- `GET /availability?doctorId=`
- `POST /time-slots`
- `GET /time-slots?doctorId=`
- `POST /appointments`
- `GET /appointments?patientId=`
- `PATCH /appointments/:id/status`

Payments
- `POST /payments`
- `GET /payments?patientId=`
- `POST /payments/:id/confirm`
- `POST /transactions`

Medical records
- `GET /medical-records/:patientId`
- `POST /encounters`
- `GET /encounters?patientId=`
- `POST /prescriptions`
- `POST /attachments`

Notifications
- `GET /notifications`
- `PATCH /notifications/:id/read`

Video
- `POST /video/sessions`
- `POST /video/tokens`

AI
- `POST /ai/triage`
- `POST /ai/summary`
- `GET /ai/logs`

## 4) Module breakdown

Frontend modules
- Auth, onboarding, profile management
- Patient portal: appointments, payments, records
- Doctor portal: availability, appointments, encounters
- Admin console: users, content moderation, audit logs
- Notifications and messaging
- Video visit UI (Jitsi embed)

Backend modules
- Auth and access control
- Users, patients, doctors, admins
- Geo (multi-country configs)
- Scheduling (availability, time slots, appointments)
- Billing (payments, wallets, transactions)
- Medical records (records, encounters, prescriptions, attachments)
- Notifications (email, SMS, push, in-app)
- Audit logs
- Video sessions (Jitsi orchestration)
- AI services (prompt orchestration + logging)

## 5) Integration points

Payments
- Mobile Money (MoMo): country-specific providers
- Stripe for card payments and payouts

Messaging
- SMS: Twilio or Africa's Talking
- Email: SES or SendGrid

Telemedicine
- Jitsi: self-hosted or JaaS
- Session creation and tokenized access via backend

AI engine
- Separate AI service (internal or managed provider)
- Backend orchestrates prompts, stores logs in `AiLog`

## 6) Security model

Auth and access
- JWT access + refresh tokens, short-lived access tokens
- Role-based access control (RBAC) with permissions
- Country-scoped access for all data operations

Data protection
- Soft deletes on business entities
- PII encrypted at rest where required
- Audit logging for sensitive actions

API security
- Input validation via DTOs and pipes
- Rate limiting, request throttling, and IP reputation checks
- Signed webhooks for payment providers

## 7) Deployment plan (Vercel + Railway)

Frontend (Vercel)
- Deploy `apps/web`
- Configure environment variables for API base URL, auth keys, and feature flags
- Preview deployments for pull requests

Backend (Railway)
- Deploy `apps/api`
- Attach PostgreSQL database
- Run Prisma migrations in a release step
- Configure secrets for JWT keys, payment providers, Jitsi, AI, and messaging

Operational
- Centralized logging (Railway + external aggregator)
- Metrics and alerting (Sentry, OpenTelemetry)
- Backups for PostgreSQL with retention policies
