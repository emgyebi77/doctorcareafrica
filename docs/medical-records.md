# Medical Records Module

## Backend module

Location: `apps/api/src/modules/medical-records`
- `medical-records.module.ts`
- `medical-records.controller.ts`
- `medical-records.service.ts`
- `dto/`
  - `create-encounter.dto.ts`
  - `create-prescription.dto.ts`
  - `create-attachment.dto.ts`

## API routes

Base path: `/api/v1/medical-records`
- `GET /:patientId` (record + encounters + attachments)
- `POST /encounters`
- `POST /prescriptions`
- `POST /attachments`

## Example payloads

Create encounter
- POST `/api/v1/medical-records/encounters`
- Authorization: `Bearer <access-token>`
- Body:
  - `patientId`: `<uuid>`
  - `occurredAt`: `2025-01-01T10:00:00Z`
  - `chiefComplaint`: `Headache`
  - `notes`: `Patient reports headaches for 3 days.`

Create prescription
- POST `/api/v1/medical-records/prescriptions`
- Authorization: `Bearer <access-token>`
- Body:
  - `encounterId`: `<uuid>`
  - `medicationName`: `Ibuprofen`
  - `dosage`: `200mg`
  - `frequency`: `Twice daily`

Create attachment
- POST `/api/v1/medical-records/attachments`
- Authorization: `Bearer <access-token>`
- Body:
  - `medicalRecordId`: `<uuid>`
  - `fileName`: `lab-results.pdf`
  - `fileUrl`: `https://files.example.com/lab-results.pdf`
  - `mimeType`: `application/pdf`
  - `sizeBytes`: `120000`

## UI screens

Frontend folder: `apps/web/app/medical-records`
- `encounters` (encounter notes)
- `notes` (notes editor)
- `prescriptions` (prescription editor)
- `attachments` (attachment upload)

## Tests

Unit tests:
- `apps/api/src/modules/medical-records/__tests__/medical-records.service.spec.ts`

Integration tests:
- `apps/api/test/medical-records.e2e-spec.ts`

## Security notes

- JWT required for all medical records endpoints.
- Role-based access: patients can access their own records, doctors via appointment relationship, admins via support access.
- Audit logs capture record changes.
