# AI Orchestration Module

## Backend module

Location: `apps/api/src/modules/ai`
- `ai.module.ts`
- `ai.controller.ts`
- `ai.service.ts`
- `ai.templates.ts`
- `ai.safety.ts`
- `dto/`
  - `ai-triage.dto.ts`
  - `ai-summary.dto.ts`
  - `ai-followup.dto.ts`
  - `ai-education.dto.ts`
  - `ai-translate.dto.ts`
  - `ai-log-query.dto.ts`
- `ai-specialty-routing.dto.ts`
- `ai-notes-assistant.dto.ts`
- `ai-safety-check.dto.ts`
- `ai-patient-chat.dto.ts`

## API routes

Base path: `/api/v1/ai`
- `POST /triage`
- `POST /symptom-guidance`
- `POST /summary`
- `POST /specialty-routing`
- `POST /notes-assistant`
- `POST /safety-check`
- `POST /patient-chat`
- `POST /followup`
- `POST /education`
- `POST /translate`
- `GET /logs` (admin only)

## Example payloads

Symptom guidance
- POST `/api/v1/ai/symptom-guidance`
- Body:
  - `symptoms`: `Mild headache`
  - `duration`: `1 day`
  - `age`: `32`
  - `context`: `No fever, mild stress`

Triage
- POST `/api/v1/ai/triage`
- Body:
  - `symptoms`: `Headache and fever`
  - `duration`: `2 days`
  - `age`: `32`

Summary
- POST `/api/v1/ai/summary`
- Body:
  - `notes`: `Patient reports headache, no nausea.`

Specialty routing
- POST `/api/v1/ai/specialty-routing`
- Body:
  - `symptoms`: `Chest pain`
  - `age`: `45`
  - `context`: `Symptoms with exertion`

Notes assistant
- POST `/api/v1/ai/notes-assistant`
- Body:
  - `notes`: `Patient reports dizziness, vitals stable.`
  - `visitType`: `Follow-up`
  - `language`: `en`

Safety check
- POST `/api/v1/ai/safety-check`
- Body:
  - `content`: `Provide general guidance for headaches.`

Patient chat
- POST `/api/v1/ai/patient-chat`
- Body:
  - `message`: `I have a mild cough.`
  - `language`: `en`
  - `context`: `No fever`

Follow-up
- POST `/api/v1/ai/followup`
- Body:
  - `plan`: `Hydration, rest, follow-up in 3 days.`

Education
- POST `/api/v1/ai/education`
- Body:
  - `topic`: `Hypertension`
  - `language`: `en`

Translate
- POST `/api/v1/ai/translate`
- Body:
  - `text`: `Take one tablet daily.`
  - `targetLanguage`: `fr`

## Safety filters

- Input length capped and blocked terms are rejected.
- All requests are logged to `AiLog` for auditability.
- Symptom guidance is explicitly non-diagnostic.
- Safety checker blocks prescribing requests.

## Tests

Unit tests:
- `apps/api/src/modules/ai/__tests__/ai.service.spec.ts`

Integration tests:
- `apps/api/test/ai.e2e-spec.ts`

## Configuration

- `AI_MODEL` selects the model name for logging.
- `AI_PROVIDER` can be set for future provider selection (defaults to mock).
