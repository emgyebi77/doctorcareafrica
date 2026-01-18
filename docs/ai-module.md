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

## API routes

Base path: `/api/v1/ai`
- `POST /triage`
- `POST /symptom-guidance`
- `POST /summary`
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

## Tests

Unit tests:
- `apps/api/src/modules/ai/__tests__/ai.service.spec.ts`

Integration tests:
- `apps/api/test/ai.e2e-spec.ts`

## Configuration

- `AI_MODEL` selects the model name for logging.
- `AI_PROVIDER` can be set for future provider selection (defaults to mock).
