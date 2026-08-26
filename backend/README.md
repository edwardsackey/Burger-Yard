# Burger Yard — Backend

Express + TypeScript API backing the Burger Yard customer app (and, eventually,
the admin console). Prisma ORM (v7, driver adapters) on PostgreSQL.

## Stack

- **Express 5** (TypeScript, `tsx watch` for dev)
- **Prisma ORM v7** via `@prisma/adapter-pg` (driver adapters are required in v7 — see `src/prisma.ts`)
- **PostgreSQL**
- **JWT** auth (`jsonwebtoken`, `bcryptjs` for password hashing where still used)

## Environment variables (`backend/.env`)

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 3000) |
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Signs auth tokens |
| `PAYSTACK_SECRET_KEY` | Payment initialization/verification/webhook signature check |
| `ARKESEL_API_KEY` | Sends real OTP SMS. Falls back to logging the code to the console when unset (safe for local dev) |
| `ARKESEL_SENDER_ID` | Sender name shown on the SMS (needs to be registered with Ghanaian carriers for reliable fast delivery) |
| `GOOGLE_PLACES_API_KEY` | Powers checkout's map landmark lookup. Falls back to a placeholder landmark when unset |

## Running locally

```
cd backend
npm install
npx prisma generate
npm run dev
```

Schema changes are applied with `npx prisma db push` (this project has no
formal migration history — it was never started with `prisma migrate`, so
`db push` is the established way to sync schema changes here). Seed the menu
catalog with `npx tsx prisma/seed.ts`.

## Why the backend is being restructured

The backend was originally scaffolded around a **multi-restaurant** model
(`Restaurant → MenuItem/Order`). The actual frontend is a **single-shop app**
with no restaurant-selection concept anywhere in its UI, so the backend is
being brought in line with what the app actually is, rather than carrying
unused multi-tenant complexity:

- **Dropped `Restaurant` entirely.** `MenuItem` and `Order` no longer
  reference it.
- **Customer auth is phone+OTP-first**, not email+password-first. `email`
  and `password_hash` on `User` are now optional — the current frontend
  collects only name + phone at signup and never asks for a password.
  The original email/password `register`/`login` endpoints are left
  in place but unused by the current UI.
- **Real OTP delivery via Arkesel** (SMS), not console-only simulation.
  Falls back to a console log when no API key is configured, so local dev
  never breaks for lack of a paid SMS account.
- **Real order creation + Paystack payment**, including a
  `GET /payments/verify/:reference` endpoint that gives the app an
  immediate, authoritative answer about whether a charge actually
  succeeded — without depending on a publicly reachable webhook URL. This
  matters for local dev (no public URL to receive Paystack's webhook) and
  doubles as a safety net in production alongside the webhook.
- **A real address book** (`Address` model, one default per user) backing
  the app's saved-addresses screen, replacing what used to be a single
  free-text `address` field.
- **Google Places integration** for the checkout map picker — given a
  tapped map location, resolves the nearest landmark + locality for the
  delivery landmark field.

## Current schema (Prisma models)

- **`User`** — `role` is `CUSTOMER | STAFF | OWNER`. For customers, phone is
  the login identifier and email/password are optional legacy fields. The
  **owner** signs in via email/password on this same model (`role: OWNER`) —
  there's exactly one real owner account per business, created directly in
  the database, not through a signup screen.
- **`Staff`** — separate from `User` entirely, since staff sign in with a
  name + 4-digit PIN, not a password. Only `pinHash` is ever stored; the
  plaintext PIN exists only in the API response the moment it's created or
  regenerated, then never again.
- **`Address`** — a user's saved delivery addresses (`label`, `details`,
  `city`, `isDefault`). Exactly one address per user is ever marked default
  (enforced in the controller, not the schema).
- **`MenuItem`** — the product catalog. Currently just
  `name`/`description`/`price`/`image_url` — no category/availability
  fields yet (see Roadmap).
- **`Order`** — one customer order: payment method/network, delivery fee,
  landmark, linked address, and status (`PENDING → PREPARING → OUT_FOR_DELIVERY → DELIVERED`,
  or `CANCELLED`). Also carries `riderName`/`riderPhone`/`riderVehicle` (set
  by the admin when a rider is assigned) and `deliveryCode` — a 4-digit code
  generated at checkout that's the customer's own proof-of-receipt.
  **`deliveryCode` must never be exposed on any admin-facing query** — it's
  explicitly `omit`ted in `getAllOrders` and `updateOrderStatus`, and
  stripped in `getOrderStatus` whenever the requester is an admin. Keep that
  invariant if you touch those queries.
- **`OrderItem`** — line items, with a `price_at_time_of_order` snapshot
  and an `extras` JSON snapshot of selected add-ons (so a later menu price
  change never rewrites history).

## API surface

| Route group | Notes |
|---|---|
| `POST /api/auth/signup`, `/request-otp`, `/verify-otp` | Phone-first customer auth (current flow) |
| `POST /api/auth/register`, `/login`, `/forgot-password`, `/reset-password` | Legacy email/password flow — kept, unused by the current UI |
| `GET/PUT /api/auth/me` | Profile |
| `GET /api/customer/menu` | Public menu listing |
| `POST /api/customer/orders` | Place an order from the cart |
| `GET /api/customer/orders/:id`, `/users/me/orders` | Order lookup / history |
| `GET/POST/PUT/DELETE /api/addresses`, `PATCH /:id/default` | Address book CRUD |
| `POST /api/payments/initialize` | Starts a Paystack transaction for an order |
| `GET /api/payments/verify/:reference` | Authoritative payment status check (see above) |
| `POST /api/payments/webhook` | Paystack webhook (production path) |
| `GET /api/places/nearby-landmark` | Map-tap → landmark + city lookup |
| `POST /api/admin/menu`, `GET /api/admin/orders`, `PUT /api/admin/orders/:id/status` | Staff-or-owner. `getAllOrders` and the status update both `omit` `deliveryCode` |
| `POST /api/admin/auth/owner-login` | Owner email/password login |
| `GET /api/admin/auth/active-staff` | Public — name+id only, for the staff sign-in picker |
| `POST /api/admin/auth/staff-login` | Staff PIN login (`staffId` + `pin`) |
| `GET/POST/PUT/DELETE /api/admin/staff`, `POST /:id/regenerate-pin` | Owner-only staff management. A PIN is only ever returned in plaintext once, from `createStaff`/`regenerateStaffPin` — never retrievable afterward |

## Roadmap — what's still ahead

Admin auth (owner login + staff PIN login) is now real — see Changelog. What's
still mock or unbuilt:

- Menu management (category, availability, image upload) — `MenuItem` needs
  these fields added when this work starts
- Admin views for orders, customers, payments, and reports, backed by real
  aggregation queries instead of the current hardcoded arrays
- Per the current plan, the admin console ships as its **own web-only
  build** at a separate URL — never bundled into the customer app that goes
  to the app stores
- **No rider-facing interface exists yet.** Rider name/phone/vehicle are set
  manually via `updateOrderStatus` for now — there's no way for a rider to
  interact with the system at all. Two features are blocked on this:
  real-time rider location on the tracking map, and completing a delivery
  by having the rider enter the customer's delivery code (currently the
  code is generated and shown to the customer, but nothing ever verifies
  it — there's no endpoint for it since there's no one to call it). Both
  need at minimum a lightweight rider-facing page before they can be built.

## Changelog

Log major backend changes here going forward — schema changes, new
integrations, new endpoints, breaking changes to existing ones.

### 2026-08-26
- Added this README.
- Dropped `Restaurant`; simplified `MenuItem`/`Order` to match the
  single-shop frontend.
- Added `Address` model + CRUD endpoints.
- Added phone-first `signup` endpoint; made `email`/`password_hash`
  optional on `User`; removed the 5-attempt OTP lockout (real SMS credits
  are limited, and it wasn't worth the friction).
- Wired real order creation (`POST /customer/orders`) and Paystack payment
  (`initialize` + new `verify/:reference` endpoint) end-to-end.
- Added Arkesel SMS integration for OTP delivery (was console-only before).
- Added Google Places integration (`GET /places/nearby-landmark`) for the
  checkout map picker.
- Seeded the real menu catalog (9 items) matching the frontend's product
  list.
- Added `riderName`/`riderPhone`/`riderVehicle` and a customer-only
  `deliveryCode` to `Order`; `updateOrderStatus` can now assign a rider
  alongside a status change. `deliveryCode` is explicitly excluded from
  every admin-facing order query.
- Wired the order-tracking page to real, polled order data (previously
  100% hardcoded, and disconnected from the actual order — checkout,
  order-placed, and order-tracking now share the real order id end to end).
  Live rider location and delivery-code verification are intentionally not
  built yet — see Roadmap.
- **Real admin auth**, replacing the mock `AdminSession.tsx` (which had a
  plaintext owner password and staff PINs hardcoded in the shipped JS
  bundle). Split `Role` into `CUSTOMER | STAFF | OWNER` (was
  `CUSTOMER | ADMIN`); added a `Staff` model; added owner login, staff PIN
  login, and owner-only staff CRUD. Created the one real owner account
  directly in the database (email/password, not a signup flow — see the
  `User` schema note above for why).
