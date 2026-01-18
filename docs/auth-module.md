# Auth Module (NestJS)

## Module folder

Location: `apps/api/src/modules/auth`
- `auth.module.ts`
- `auth.controller.ts`
- `auth.service.ts`
- `auth.constants.ts`
- `auth.types.ts`
- `dto/`
  - `login.dto.ts`
  - `logout.dto.ts`
  - `refresh-token.dto.ts`
  - `register.dto.ts`
- `strategies/`
  - `jwt.strategy.ts`

## Prisma updates

The module adds `RefreshToken`, `AuthSession`, and `OtpChallenge` models to
support token rotation, session tracking, and OTP login. See
`prisma/schema.prisma`.

## API routes

Base path: `/api/v1/auth`
- `POST /register` (create patient or doctor account)
- `POST /login` (issue access + refresh tokens)
- `POST /refresh` (rotate refresh token and issue new access token)
- `POST /otp/request` (send OTP via SMS/email)
- `POST /otp/verify` (verify OTP and issue tokens)
- `POST /logout` (revoke one or all refresh tokens)
- `GET /sessions` (list active sessions)
- `POST /sessions/:id/revoke` (revoke a session)

## Example payloads

Register (patient)
- POST `/api/v1/auth/register`
- Body:
  - `email`: `patient@example.com`
  - `password`: `Password123!`
  - `countryId`: `<uuid>`
  - `role`: `PATIENT`

Register (doctor)
- POST `/api/v1/auth/register`
- Body:
  - `email`: `doctor@example.com`
  - `password`: `Password123!`
  - `countryId`: `<uuid>`
  - `role`: `DOCTOR`
  - `doctorProfile`:
    - `licenseNumber`: `DOC-12345`
    - `specialty`: `Cardiology`
    - `yearsExperience`: `10`

Login
- POST `/api/v1/auth/login`
- Body:
  - `identifier`: `patient@example.com`
  - `password`: `Password123!`

Refresh
- POST `/api/v1/auth/refresh`
- Body:
  - `refreshToken`: `<refresh-token>`

OTP request
- POST `/api/v1/auth/otp/request`
- Body:
  - `identifier`: `patient@example.com`
  - `channel`: `EMAIL`

OTP verify
- POST `/api/v1/auth/otp/verify`
- Body:
  - `identifier`: `patient@example.com`
  - `channel`: `EMAIL`
  - `code`: `123456`

Logout (single token)
- POST `/api/v1/auth/logout`
- Authorization: `Bearer <access-token>`
- Body:
  - `refreshToken`: `<refresh-token>`

Logout (all tokens)
- POST `/api/v1/auth/logout`
- Authorization: `Bearer <access-token>`
- Body: `{}` (or omit body)

List sessions
- GET `/api/v1/auth/sessions`
- Authorization: `Bearer <access-token>`

Revoke session
- POST `/api/v1/auth/sessions/<session-id>/revoke`
- Authorization: `Bearer <access-token>`

## Tests

Unit tests:
- `apps/api/src/modules/auth/__tests__/auth.service.spec.ts`

Integration tests:
- `apps/api/test/auth.e2e-spec.ts`

## Security notes

- Refresh tokens are stored as SHA-256 hashes and rotated on refresh.
- Revoked tokens are tracked with `revokedAt` and `replacedById`.
- Access tokens are short-lived; refresh tokens are longer-lived.
- JWT payloads include `role` and `countryId` for authorization checks.
- Login rejects non-active users and mismatched country scope.
- OTPs are hashed at rest, expire after a short TTL, and enforce max attempts.
- Audit logs record auth events for monitoring and compliance.
- Sessions can be revoked independently to support account security.
