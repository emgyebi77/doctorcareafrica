# Patient Onboarding Module

## Backend module

Location: `apps/api/src/modules/patient-onboarding`
- `patient-onboarding.module.ts`
- `patient-onboarding.controller.ts`
- `patient-onboarding.service.ts`
- `dto/`
  - `phone-otp-request.dto.ts`
  - `phone-otp-verify.dto.ts`
  - `profile-setup.dto.ts`
  - `emergency-contact.dto.ts`
  - `medical-history.dto.ts`

## API routes

Base path: `/api/v1/patient-onboarding`
- `POST /phone/request-otp`
- `POST /phone/verify-otp`
- `GET /countries`
- `PATCH /profile`
- `PATCH /emergency-contact`
- `PATCH /medical-history`

## Example payloads

Phone OTP request
- POST `/api/v1/patient-onboarding/phone/request-otp`
- Body:
  - `phone`: `+23300000000`
  - `countryId`: `<uuid>`

Phone OTP verify
- POST `/api/v1/patient-onboarding/phone/verify-otp`
- Body:
  - `phone`: `+23300000000`
  - `code`: `123456`

Profile setup
- PATCH `/api/v1/patient-onboarding/profile`
- Authorization: `Bearer <access-token>`
- Body:
  - `firstName`: `Ama`
  - `lastName`: `Mensah`
  - `dateOfBirth`: `1995-01-20`
  - `gender`: `FEMALE`
  - `regionId`: `<uuid>`
  - `cityId`: `<uuid>`
  - `timezone`: `Africa/Accra`
  - `locale`: `en-GH`

Countries response highlights
- `GET /api/v1/patient-onboarding/countries` returns currency, locale, and provider defaults.

Emergency contact
- PATCH `/api/v1/patient-onboarding/emergency-contact`
- Authorization: `Bearer <access-token>`
- Body:
  - `emergencyContactName`: `Kofi Mensah`
  - `emergencyContactPhone`: `+23300000001`

Medical history
- PATCH `/api/v1/patient-onboarding/medical-history`
- Authorization: `Bearer <access-token>`
- Body:
  - `allergies`: `["Pollen", "Penicillin"]`
  - `conditions`: `["Asthma"]`
  - `medications`: `["Albuterol"]`

## UI screens

Frontend folder: `apps/web/app/onboarding`
- `phone` (phone login)
- `otp` (OTP verification)
- `country` (country selection)
- `profile` (profile setup)
- `emergency` (emergency contact)
- `history` (medical history)

## Tests

Unit tests:
- `apps/api/src/modules/patient-onboarding/__tests__/patient-onboarding.service.spec.ts`

Integration tests:
- `apps/api/test/patient-onboarding.e2e-spec.ts`

## Security notes

- OTP codes are hashed at rest with short TTLs and attempt limits.
- JWT access is required for profile and medical updates.
- Patient-only access enforced with RBAC guards.
- Audit logs capture onboarding events.
