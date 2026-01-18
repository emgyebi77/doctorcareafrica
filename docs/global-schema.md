# Global PostgreSQL Schema (Prisma)

This document describes the global Prisma schema in `prisma/schema.prisma`,
including the entity relationships, migration command, and extension rules.

## ERD explanation (high level)

Identity and geography
- `Country` → `Region` → `City` define multi-country geography.
- `User` is the core identity and references `Country`/`Region`/`City`.
- `Patient`, `Doctor`, and `Admin` are 1:1 profiles mapped to `User`.

Scheduling and care delivery
- `Doctor` → `Availability` → `TimeSlot` define provider schedules.
- `Appointment` links `Patient` + `Doctor`, with an optional `TimeSlot`.
- `VideoSession` is a 1:1 extension of `Appointment`.
- `VideoToken` grants access for a `User` to a `VideoSession`.

Clinical records
- `MedicalRecord` is 1:1 with `Patient`.
- `Encounter` belongs to `MedicalRecord`, and can reference an `Appointment`.
- `Prescription` belongs to an `Encounter`.
- `Attachment` can reference `MedicalRecord`, `Encounter`, or `Prescription`.

Financials
- `Wallet` is 1:1 with `User`.
- `Payment` can reference an `Appointment` and optional `Wallet`.
- `Transaction` belongs to a `Wallet` and optionally references a `Payment`.
- `PaymentRefund` tracks refund attempts and outcomes.
- `WebhookEvent` stores payment provider webhook payloads.

Operational logging
- `Notification` targets a `User`.
- `AuditLog` records actor actions against any entity.
- `AiLog` stores AI interactions and can link to `User`, `Patient`, `Doctor`,
  and/or `Encounter`.
- `RefreshToken` stores hashed refresh tokens for session rotation.
- `AuthSession` tracks active login sessions.
- `OtpChallenge` stores one-time codes for OTP login.
- `DoctorOnboarding` tracks doctor onboarding status and approvals.
- `DoctorKycDocument` stores KYC document metadata and review status.
- `VideoSession` includes optional `jitsiRegion` for multi-region routing.

## Migration command

Use Prisma migrations to apply the schema:

- `npx prisma migrate dev --name init_global_schema`

## Guidelines for extending the schema

1) Do not redefine core entities (`User`, `Patient`, `Doctor`, `Appointment`,
   `Payment`, `MedicalRecord`, `VideoSession`).
2) Preserve JWT + roles/permissions at the application layer and never add
   parallel auth sources in the DB.
3) Keep multi-country fields (`countryId`, timezone, currency, locale) on all
   new models that represent business data.
4) Add `createdAt`, `updatedAt`, and `deletedAt` (soft delete) where applicable.
5) Always add indexes for high-cardinality filters and foreign keys.
6) Prefer new relations over duplicating data or logic.
7) Add input validation, logging, and error handling in application code.
8) Add unit + integration tests for critical new flows.
