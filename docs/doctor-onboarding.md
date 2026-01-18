# Doctor Onboarding + KYC Module

## Backend module

Location: `apps/api/src/modules/doctor-onboarding`
- `doctor-onboarding.module.ts`
- `doctor-onboarding.controller.ts`
- `doctor-onboarding.service.ts`
- `dto/`
  - `doctor-otp-request.dto.ts`
  - `doctor-otp-verify.dto.ts`
  - `doctor-profile.dto.ts`
  - `doctor-document.dto.ts`
  - `doctor-availability.dto.ts`
  - `doctor-timeslot.dto.ts`
  - `doctor-review.dto.ts`

## API routes

Base path: `/api/v1/doctor-onboarding`
- `POST /request-otp`
- `POST /verify-otp`
- `PATCH /profile`
- `POST /documents`
- `POST /availability`
- `POST /time-slots`
- `POST /submit`
- `GET /admin/pending`
- `POST /admin/:id/approve`
- `POST /admin/:id/reject`
- `POST /admin/documents/:id/approve`
- `POST /admin/documents/:id/reject`

## Example payloads

OTP request (email)
- POST `/api/v1/doctor-onboarding/request-otp`
- Body:
  - `channel`: `EMAIL`
  - `email`: `doctor@example.com`
  - `countryId`: `<uuid>`

OTP request (phone)
- POST `/api/v1/doctor-onboarding/request-otp`
- Body:
  - `channel`: `SMS`
  - `phone`: `+23300000000`
  - `countryId`: `<uuid>`

OTP verify
- POST `/api/v1/doctor-onboarding/verify-otp`
- Body:
  - `channel`: `SMS`
  - `phone`: `+23300000000`
  - `code`: `123456`

Profile update
- PATCH `/api/v1/doctor-onboarding/profile`
- Authorization: `Bearer <access-token>`
- Body:
  - `firstName`: `Ama`
  - `lastName`: `Mensah`
  - `specialty`: `Cardiology`
  - `licenseNumber`: `DOC-12345`
  - `yearsExperience`: `10`
  - `regionId`: `<uuid>`
  - `cityId`: `<uuid>`

Document upload
- POST `/api/v1/doctor-onboarding/documents`
- Authorization: `Bearer <access-token>`
- Body:
  - `type`: `LICENSE`
  - `fileName`: `license.pdf`
  - `fileUrl`: `https://files.example.com/license.pdf`
  - `mimeType`: `application/pdf`
  - `sizeBytes`: `120000`

Availability
- POST `/api/v1/doctor-onboarding/availability`
- Authorization: `Bearer <access-token>`
- Body:
  - `type`: `RECURRING`
  - `dayOfWeek`: `1`
  - `startTime`: `2025-01-01T09:00:00Z`
  - `endTime`: `2025-01-01T17:00:00Z`
  - `timezone`: `Africa/Accra`

Time slot
- POST `/api/v1/doctor-onboarding/time-slots`
- Authorization: `Bearer <access-token>`
- Body:
  - `availabilityId`: `<uuid>`
  - `startTime`: `2025-01-01T10:00:00Z`
  - `endTime`: `2025-01-01T10:30:00Z`
  - `timezone`: `Africa/Accra`

## UI screens

Frontend folder: `apps/web/app/doctor-onboarding`
- `login` (phone/email login)
- `otp` (OTP verification)
- `specialty` (specialty selection)
- `documents` (document upload)
- `availability` (availability setup)
- `status` (approval status)

## Tests

Unit tests:
- `apps/api/src/modules/doctor-onboarding/__tests__/doctor-onboarding.service.spec.ts`

Integration tests:
- `apps/api/test/doctor-onboarding.e2e-spec.ts`

## Security notes

- OTPs are short-lived and hashed in storage.
- JWT required for profile, document, and availability updates.
- Admin approval endpoints require admin roles.
- Notifications are created for onboarding and KYC decisions.
- Audit logs capture onboarding lifecycle events.
