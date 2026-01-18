# Admin Dashboard

## Backend module

Location: `apps/api/src/modules/admin-dashboard`
- `admin-dashboard.module.ts`
- `admin-dashboard.controller.ts`
- `admin-dashboard.service.ts`
- `dto/`
  - `update-user-status.dto.ts`
  - `create-country.dto.ts`
  - `update-country.dto.ts`
  - `create-region.dto.ts`
  - `update-region.dto.ts`
  - `create-city.dto.ts`
  - `update-city.dto.ts`

## API routes

Base path: `/api/v1/admin`
- `GET /users` (user management)
- `PATCH /users/:id/status`
- `GET /doctors/pending`
- `POST /doctors/:id/approve`
- `POST /doctors/:id/reject`
- `GET /appointments`
- `GET /payments`
- `GET /countries`
- `POST /countries`
- `PATCH /countries/:id`
- `POST /regions`
- `PATCH /regions/:id`
- `POST /cities`
- `PATCH /cities/:id`
- `GET /analytics`

## Example payloads

Update user status
- PATCH `/api/v1/admin/users/<user-id>/status`
- Body:
  - `status`: `SUSPENDED`

Approve doctor
- POST `/api/v1/admin/doctors/<onboarding-id>/approve`
- Body:
  - `notes`: `All documents verified.`

Create country
- POST `/api/v1/admin/countries`
- Body:
  - `name`: `Ghana`
  - `isoCode2`: `GH`
  - `isoCode3`: `GHA`
  - `currency`: `GHS`
  - `timezone`: `Africa/Accra`
  - `locale`: `en-GH`
  - `supportedLocales`: `["en-GH", "fr"]`
  - `jitsiRegion`: `africa`
  - `momoProvider`: `MTN`
  - `momoProviders`: `{ "+233": "MTN", "default": "MTN" }`

## UI pages

Frontend folder: `apps/web/app/admin`
- `users` (user management)
- `doctors` (doctor approval)
- `appointments` (appointment oversight)
- `payments` (payment monitoring)
- `countries` (country configuration)
- `analytics` (analytics)

## Tests

Unit tests:
- `apps/api/src/modules/admin-dashboard/__tests__/admin-dashboard.service.spec.ts`

Integration tests:
- `apps/api/test/admin-dashboard.e2e-spec.ts`

## Security notes

- Admin-only access enforced with JWT + RBAC.
- Audit logs capture user status and configuration changes.
