# Telemedicine Module (Jitsi)

## Backend module

Location: `apps/api/src/modules/telemedicine`
- `telemedicine.module.ts`
- `telemedicine.controller.ts`
- `telemedicine.service.ts`
- `dto/`
  - `create-video-session.dto.ts`

## API routes

Base path: `/api/v1/telemedicine`
- `POST /sessions` (create session)
- `POST /sessions/:id/token` (generate join token)
- `POST /sessions/:id/start` (start session)
- `POST /sessions/:id/end` (end session)
- `GET /sessions/:id` (session details)

## Example payloads

Create session
- POST `/api/v1/telemedicine/sessions`
- Authorization: `Bearer <access-token>`
- Body:
  - `appointmentId`: `<uuid>`
  - `jitsiRegion`: `africa`

Generate join token
- POST `/api/v1/telemedicine/sessions/<session-id>/token`
- Authorization: `Bearer <access-token>`
- Body: `{}` (empty)

Start session
- POST `/api/v1/telemedicine/sessions/<session-id>/start`
- Authorization: `Bearer <access-token>`

End session
- POST `/api/v1/telemedicine/sessions/<session-id>/end`
- Authorization: `Bearer <access-token>`

## Frontend pages

Frontend folder: `apps/web/app/telemedicine`
- `/telemedicine/[sessionId]/precall` (pre-call device check)
- `/telemedicine/[sessionId]/call` (embedded Jitsi IFrame + controls)
- `/telemedicine/[sessionId]/summary` (post-call summary)

## Tests

Unit tests:
- `apps/api/src/modules/telemedicine/__tests__/telemedicine.service.spec.ts`

Integration tests:
- `apps/api/test/telemedicine.e2e-spec.ts`

## Security notes

- JWT required for all telemedicine endpoints.
- Role-based access allows only appointment patient or doctor.
- Audit logs capture session lifecycle events.
- Join tokens are short-lived and stored in `VideoToken`.

## Jitsi integration notes

- `JITSI_DOMAIN` config controls the join URL base.
- `jitsiRegion` is optional and used for multi-region routing.
