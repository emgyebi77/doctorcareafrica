GLOBAL RULE - DOCTOR CARE AFRICA
================================

Purpose
-------
These rules apply to every new module and change introduced in this repo.
They are non-negotiable design constraints to keep the platform consistent.

Core rules
----------
1) Reuse and extend the existing global PostgreSQL schema.
   - Do NOT redefine core entities such as User, Patient, Doctor, Appointment,
     Payment, MedicalRecord, or VideoSession.
   - Preserve naming conventions, relationships, and constraints.

2) Respect the existing auth model.
   - JWT, roles, and permissions must remain the source of truth.
   - Do not add parallel auth paths or bypass authorization checks.

3) Preserve multi-country configuration.
   - Country, timezone, currency, and locale must be supported in every module.
   - No hard-coded single-country assumptions.

4) Include logging, validation, error handling, and security considerations.
   - Log key actions and errors without leaking sensitive data.
   - Validate input at boundaries and enforce schema constraints.
   - Handle errors consistently with the platform conventions.
   - Apply security best practices for access control and data handling.

5) Include tests for critical flows.
   - Unit tests for core logic.
   - Integration tests for module entry points and data flows.

6) Avoid duplication of logic and schema.
   - Prefer shared utilities and existing services.
   - Refactor if a new module would duplicate a core behavior.

Implementation checklist
------------------------
- Schema reuse confirmed; no core entity redefined.
- Auth enforced (JWT, roles, permissions).
- Multi-country support validated (country, timezone, currency, locale).
- Logging and input validation added.
- Error handling and security review done.
- Unit and integration tests added for critical flows.
