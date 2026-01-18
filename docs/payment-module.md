# Payment Module

## Backend module

Location: `apps/api/src/modules/payments`
- `payments.module.ts`
- `payments.controller.ts`
- `payments.service.ts`
- `dto/`
  - `create-checkout.dto.ts`
  - `refund.dto.ts`
  - `stripe-webhook.dto.ts`
  - `momo-webhook.dto.ts`

## API routes

Base path: `/api/v1/payments`
- `POST /checkout` (create checkout session)
- `POST /:id/confirm` (admin confirm)
- `POST /:id/refund` (refund)
- `GET /me` (patient payments)
- `GET /admin` (admin monitoring)
- `POST /webhooks/stripe`
- `POST /webhooks/momo`

## Example payloads

Checkout (MoMo)
- POST `/api/v1/payments/checkout`
- Authorization: `Bearer <access-token>`
- Body:
  - `amount`: `50`
  - `currency`: `GHS` (optional; defaults to country currency)
  - `provider`: `MOMO`
  - `momoPhone`: `+23300000000`

Checkout (Stripe)
- POST `/api/v1/payments/checkout`
- Authorization: `Bearer <access-token>`
- Body:
  - `amount`: `75`
  - `currency`: `USD`
  - `provider`: `STRIPE`
  - `returnUrl`: `https://app.example.com/payments/status`

Refund
- POST `/api/v1/payments/<payment-id>/refund`
- Authorization: `Bearer <access-token>`
- Body:
  - `amount`: `25`
  - `reason`: `Duplicate charge`

Stripe webhook
- POST `/api/v1/payments/webhooks/stripe`
- Headers:
  - `stripe-signature`: `<signature>`
- Body:
  - `eventId`: `evt_123`
  - `eventType`: `payment_intent.succeeded`
  - `paymentReference`: `STRIPE-abc123`

MoMo webhook
- POST `/api/v1/payments/webhooks/momo`
- Headers:
  - `momo-signature`: `<signature>`
- Body:
  - `eventId`: `momo_123`
  - `eventType`: `payment.success`
  - `paymentReference`: `MOMO-abc123`

## UI screens

Frontend folder: `apps/web/app/payments`
- `checkout` (payment selection + checkout)
- `status` (success/failure state)

Admin monitoring:
- `apps/web/app/admin/payments` (payment table + refunds)

## Tests

Unit tests:
- `apps/api/src/modules/payments/__tests__/payments.service.spec.ts`

Integration tests:
- `apps/api/test/payments.e2e-spec.ts`

## Security notes

- JWT required for checkout and refund endpoints.
- Admin-only access for confirm and monitoring endpoints.
- Webhooks verify HMAC signatures using shared secrets.
- Webhook events are stored for auditability and replay protection.

## Multi-country handling

- Currency defaults to the country currency and is validated on checkout.
- MoMo checkouts resolve a country-specific provider mapping.
