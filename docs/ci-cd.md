# CI/CD and Deployment

This document defines CI/CD workflows, deployment targets, and rollback safety.

## GitHub Actions

Workflows live in `.github/workflows`:
- `ci.yml`: installs dependencies, runs lint/tests/build when available.
- `deploy.yml`: deploys web to Vercel and API to Railway on `main`.

## Safe migrations

Recommended flow for Prisma migrations:
1. Generate migrations locally and review SQL.
2. Apply to staging first using `npx prisma migrate deploy`.
3. Use Railway release commands or the deploy workflow input `run_migrations=true`.
4. Avoid destructive changes without a backfill plan.
5. Always take a database backup before production migrations.

## Vercel + Railway deployment

Frontend (Vercel):
- Deploys `apps/web` using the Vercel GitHub Action.
- Production deploys on `main` with `--prod`.

Backend (Railway):
- Deploys `apps/api` using `railway up`.
- Migrations can be run via the workflow dispatch input.

## Secrets management

GitHub Actions secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `RAILWAY_TOKEN`
- `RAILWAY_PROJECT_ID`

Vercel and Railway environment secrets:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `MOMO_WEBHOOK_SECRET`
- `JITSI_DOMAIN`
- `AI_PROVIDER`
- `AI_MODEL`

## Rollback strategy

Frontend:
- Use Vercel rollback to a previous deployment.

Backend:
- Use Railway rollback to a prior deployment.
- For database changes, prefer forward-fix migrations.
- For critical issues, restore from a verified backup.
