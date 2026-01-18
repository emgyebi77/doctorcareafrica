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

The module adds a `RefreshToken` model to store hashed refresh tokens for JWT
rotation. See `prisma/schema.prisma`.

## API routes

Base path: `/api/v1/auth`
- `POST /register` (create patient or doctor account)
- `POST /login` (issue access + refresh tokens)
- `POST /refresh` (rotate refresh token and issue new access token)
- `POST /logout` (revoke one or all refresh tokens)

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

Logout (single token)
- POST `/api/v1/auth/logout`
- Authorization: `Bearer <access-token>`
- Body:
  - `refreshToken`: `<refresh-token>`

Logout (all tokens)
- POST `/api/v1/auth/logout`
- Authorization: `Bearer <access-token>`
- Body: `{}` (or omit body)

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
