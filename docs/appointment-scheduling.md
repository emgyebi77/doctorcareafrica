# Appointment Scheduling Module

## Backend module

Location: `apps/api/src/modules/appointments`
- `appointments.module.ts`
- `appointments.controller.ts`
- `appointments.service.ts`
- `dto/`
  - `create-availability.dto.ts`
  - `create-timeslot.dto.ts`
  - `book-appointment.dto.ts`
  - `reschedule-appointment.dto.ts`
  - `cancel-appointment.dto.ts`

## API routes

Base path: `/api/v1/appointments`
- `POST /availability` (doctor availability)
- `POST /time-slots` (doctor time slots)
- `POST /` (patient booking)
- `PATCH /:id/reschedule`
- `PATCH /:id/cancel`

## Example payloads

Create availability
- POST `/api/v1/appointments/availability`
- Authorization: `Bearer <access-token>`
- Body:
  - `type`: `RECURRING`
  - `dayOfWeek`: `1`
  - `startTime`: `2025-01-01T09:00:00Z`
  - `endTime`: `2025-01-01T17:00:00Z`
  - `timezone`: `Africa/Accra`

Create time slot
- POST `/api/v1/appointments/time-slots`
- Authorization: `Bearer <access-token>`
- Body:
  - `availabilityId`: `<uuid>`
  - `startTime`: `2025-01-01T10:00:00Z`
  - `endTime`: `2025-01-01T10:30:00Z`
  - `timezone`: `Africa/Accra`

Book appointment
- POST `/api/v1/appointments`
- Authorization: `Bearer <access-token>`
- Body:
  - `timeSlotId`: `<uuid>`
  - `type`: `IN_PERSON`
  - `reason`: `Consultation`

Reschedule appointment
- PATCH `/api/v1/appointments/<appointment-id>/reschedule`
- Authorization: `Bearer <access-token>`
- Body:
  - `timeSlotId`: `<uuid>`
  - `reason`: `Schedule change`

Cancel appointment
- PATCH `/api/v1/appointments/<appointment-id>/cancel`
- Authorization: `Bearer <access-token>`
- Body:
  - `reason`: `Unable to attend`

## Timezone handling

- Availability and time slots require a timezone identifier.
- Appointments inherit the timezone from the booked time slot.
- All timestamps are stored as `DateTime` and should be sent in ISO format.

## UI screens

Frontend folder: `apps/web/app/appointments`
- `availability` (doctor availability)
- `book` (patient booking)
- `reschedule` (rescheduling)
- `cancel` (cancellation)

## Tests

Unit tests:
- `apps/api/src/modules/appointments/__tests__/appointments.service.spec.ts`

Integration tests:
- `apps/api/test/appointments.e2e-spec.ts`

## Security notes

- JWT required for all scheduling endpoints.
- Role-based access restricts patient vs doctor actions.
- Notifications are created for booking, rescheduling, and cancellation.
- Audit logs capture scheduling lifecycle events.
