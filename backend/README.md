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

## Running the mobile app across networks (cloudflared)

Testing on a phone that's **not on the same WiFi** as the dev machine (e.g. a
different network entirely) needs two things tunneled: the backend API and
Metro (the JS bundler). Expo's own built-in `--tunnel` flag (ngrok-based) has
repeatedly proven flaky ("failed to start tunnel", "remote gone away") and
also anonymous ngrok tunnels are subject to rate limits/outages — so instead
both are tunneled with `cloudflared`, which needs no account and has been
reliable. **This is now the standing way to run cross-network dev testing.**
Five terminals, in this order:

1. **Backend** — `cd backend && npm run dev`
2. **Public tunnel for the backend** — `npx cloudflared tunnel --url http://localhost:3000`.
   Take the printed `https://....trycloudflare.com` URL and set it as
   `EXPO_PUBLIC_API_URL=<that URL>/api` in `mobile/.env` (the URL is random
   each run, so this has to be updated every time this tunnel restarts).
3. **Public tunnel for Metro** — `npx cloudflared tunnel --url http://localhost:8081`.
4. **Expo (native/Expo Go)** — in `mobile/`, set the Metro tunnel URL as a
   proxy override, then start Expo *without* `--tunnel`:
   ```
   $env:EXPO_PACKAGER_PROXY_URL="<the terminal-3 URL>"
   npx expo start
   ```
   `EXPO_PACKAGER_PROXY_URL` is an undocumented-but-functional Expo CLI env
   var (`UrlCreator.js`) that makes the dev server announce a URL you supply
   instead of trying to create its own tunnel — this is what replaces
   `--tunnel`/ngrok entirely. Expo Go connects to whatever QR code/manual URL
   this prints, same as it would with a real Expo tunnel.
5. **Expo (web)** — `npx expo start --web --port 8082` (unaffected by any of
   this, since the browser and backend are on the same machine).

Both `cloudflared` terminals (2 and 3) must stay open for the whole session —
closing either breaks the backend or the Metro connection respectively.

If instead the phone **is on the same WiFi** as the dev machine, skip all of
this: just run the backend and `npx expo start` (no `--tunnel`, no proxy
override) — `mobile/api.ts` already derives the backend's LAN IP
automatically from Metro's own LAN address in that case.

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
  the database, not through a signup screen. `pushToken` stores the
  customer's Expo push token (set via `PUT /auth/push-token`), used to send
  real order-status notifications.
- **`Staff`** — separate from `User` entirely, since staff sign in with a
  name + 4-digit PIN, not a password. Only `pinHash` is ever stored; the
  plaintext PIN exists only in the API response the moment it's created or
  regenerated, then never again.
- **`Address`** — a user's saved delivery addresses (`label`, `details`,
  `city`, `isDefault`). Exactly one address per user is ever marked default
  (enforced in the controller, not the schema).
- **`MenuItem`** — the product catalog. `name`/`description`/`price`/
  `image_url`, plus a nullable `category` (used by Reports' top-items table;
  admin editing of it hasn't been built — see Roadmap). No availability
  toggle yet.
- **`Order`** — one customer order: payment method/network, delivery fee,
  landmark, linked address, and status (`NEW → PREPARING → READY → OUT_FOR_DELIVERY → COMPLETED`,
  or `CANCELLED`). Also carries `riderName`/`riderPhone`/`riderVehicle` (set
  by the admin when a rider is assigned), `acceptedAt`/`readyAt` (stamped by
  `updateOrderStatus` the moment those stages are first reached, so Reports
  can compute a real avg prep time), and `deliveryCode` — a 4-digit code
  generated at checkout that's the customer's own proof-of-receipt.
  **`deliveryCode` must never be exposed on any admin-facing query** — it's
  explicitly `omit`ted in `getAllOrders` and `updateOrderStatus`, and
  stripped in `getOrderStatus` whenever the requester is an admin. Keep that
  invariant if you touch those queries. `status` (kitchen/delivery stage) and
  `paid` (whether the order has actually been paid for) are fully
  independent fields — `status` only ever changes via admin action
  (`updateOrderStatus`), and `paid` only ever flips via a confirmed Paystack
  charge (`verifyPayment`/`paystackWebhook`). Cash-on-delivery orders stay
  `paid: false` for their entire lifecycle.
- **`OrderItem`** — line items, with a `price_at_time_of_order` snapshot
  and an `extras` JSON snapshot of selected add-ons (so a later menu price
  change never rewrites history).
- **`Rider`** — a saved delivery-rider roster (`name`, `phone`, `vehicle`,
  `active`) the admin console picks from when assigning a delivery.
  Deliberately **not** linked to `Order` by a foreign key — the name/phone/
  vehicle picked are copied onto the `Order`'s own columns at assignment
  time, so editing or removing a rider from the roster later never changes
  what already shipped on a past order.

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
| `POST /api/admin/menu`, `GET /api/admin/orders`, `PUT /api/admin/orders/:id/status` | Staff-or-owner. `getAllOrders` and the status update both `omit` `deliveryCode`. A status update sends the customer a real Expo push notification (see below) |
| `PUT /api/auth/push-token` | Authenticated customer. Saves the device's Expo push token onto `User.pushToken` |
| `GET /api/admin/customers` | Staff-or-owner. Every `CUSTOMER`-role user with their real order count, lifetime spend, and last order date computed live from `Order` — including ones with zero orders |
| `POST /api/admin/auth/owner-login` | Owner email/password login |
| `GET /api/admin/auth/active-staff` | Public — name+id only, for the staff sign-in picker |
| `POST /api/admin/auth/staff-login` | Staff PIN login (`staffId` + `pin`) |
| `GET/POST/PUT/DELETE /api/admin/staff`, `POST /:id/regenerate-pin` | Owner-only staff management. A PIN is only ever returned in plaintext once, from `createStaff`/`regenerateStaffPin` — never retrievable afterward |
| `GET/POST /api/admin/riders` | Staff-or-owner. Staff can view the roster and add a rider on the fly while assigning a delivery |
| `PUT/DELETE /api/admin/riders/:id` | Owner-only. Edit/deactivate/remove a rider from the roster |
| `GET /api/admin/dashboard?period=today\|week\|month` | Owner-only. Real sales/orders/avg-order-value/new-customer stats (with a delta vs the equivalent previous period), a revenue series bucketed to fit the period, best sellers, an hour-of-day order histogram, and the 6 most recent orders — all computed live from `Order`/`OrderItem`/`User`, nothing precomputed or cached |
| `GET /api/admin/reports?days=7\|30\|90` | Owner-only. Gross revenue and orders-completed with deltas vs the equivalent prior window, a real avg prep time (`readyAt - acceptedAt`, `null` until an order has both), a revenue trend (daily/weekly/monthly buckets depending on window size), a peak-hours histogram, and top-selling items by quantity with category + revenue |

## Roadmap — what's still ahead

Admin auth (owner login + staff PIN login), the Customers, Orders,
Dashboard, and Reports pages are now real — see Changelog. What's still
mock or unbuilt:

- Menu management (availability toggle, image upload, and an admin UI to
  set `category` — the field exists and is populated for the seeded menu,
  but nothing lets the admin edit it yet)
- Admin Payments page, backed by real transaction data. `Paid`/`Pending` are
  straightforward from `Order.paid`, but the mock's `Failed`/`Refunded`
  states have no real backing yet — nothing currently records a failed
  Paystack charge or a refund, so that needs its own small feature first
- An EAS project is now configured (`extra.eas.projectId` in `app.json`,
  under the `menialshot` Expo account), so `getExpoPushTokenAsync()` can
  actually mint real tokens in Expo Go — no custom dev build required
- Per the current plan, the admin console ships as its **own web-only
  build** at a separate URL — never bundled into the customer app that goes
  to the app stores
- **No rider-facing interface exists yet.** The admin picks a rider from the
  saved roster (or adds a new one) and it's written onto the order via
  `updateOrderStatus`, but there's no way for a rider to interact with the
  system at all. Two features are blocked on this:
  real-time rider location on the tracking map, and completing a delivery
  by having the rider enter the customer's delivery code (currently the
  code is generated and shown to the customer, but nothing ever verifies
  it — there's no endpoint for it since there's no one to call it). Both
  need at minimum a lightweight rider-facing page before they can be built.

## Changelog

Log major backend changes here going forward — schema changes, new
integrations, new endpoints, breaking changes to existing ones.

### 2026-08-29
- **Wired the admin Reports page to real data** (`GET /admin/reports`,
  owner-only), replacing every hardcoded `TOP_ITEMS`/`REVENUE`/`PEAK` array.
  Added `Order.acceptedAt`/`readyAt` (stamped by `updateOrderStatus` when
  those stages are first reached) so "avg prep time" is a real computed
  number instead of a fixed "14 min" — shows "Not tracked yet" for orders
  placed before this field existed. Also added `MenuItem.category`
  (nullable) and backfilled it for the 9 seeded items, so the top-items
  table's category badges are real instead of guessed.
- Fixed the same "always green up-arrow" bug in the shared `StatRow`
  component (used by Reports and Payments) that Dashboard's local stat
  cards had — a negative delta now shows a red down-arrow instead of
  claiming growth.
- **Wired the admin Dashboard to real data** (`GET /admin/dashboard`,
  owner-only), replacing every hardcoded `STATS`/`SALES`/`BEST_SELLERS`/
  `PEAK`/`RECENT` array. Stats now include a real delta against the
  previous equivalent period (yesterday/last week/last month); the sales
  chart, best-sellers list, and peak-hours histogram are all computed from
  real orders in the selected period rather than fixed mock numbers.
- Removed the customer-facing "orders placed" count badge from the
  profile screen's Order History row — that figure belongs to the admin
  Customers page, not something shown back to the customer themselves.
- Customer order history now shows "Delivered by {rider}" on completed
  orders once the admin has assigned one, using the same `riderName`
  already returned by `GET /customer/users/me/orders`.
- Added missing `StatusTone` entries (`Ready`, `Out for delivery`,
  `Completed`) in the admin theme — these real backend status labels were
  previously falling through to a generic grey pill because the theme only
  had the mock's original wording (`On the way`, `Delivered`).
- **Fixed an order-status auto-advance bug.** The admin Orders screen's
  "busy" guard was a `useRef`, which never triggers a re-render — so the
  action button stayed fully enabled and relabeled itself (e.g. "Accept
  order" → "Mark ready") the instant a status change landed, right under
  the admin's cursor/finger. A slightly-too-fast double-tap could land on
  the *new* button and silently skip a step. Fixed with a render-visible
  `pendingIds` state that disables the button during the request plus a
  700ms cooldown after.
- Fixed the customer-facing label for the `NEW` status, which read "Order
  accepted" even though nothing had actually been accepted by the kitchen
  yet — it now reads "Order placed", and only shows "accepted" language
  once the admin moves it to `PREPARING`.
- **Added a `Rider` model and roster.** Previously the admin typed rider
  name/phone/vehicle into free-text fields on every order — now there's a
  saved roster (`GET/POST /admin/riders`, staff-or-owner; `PUT/DELETE
  /admin/riders/:id`, owner-only) that the Orders screen picks from via a
  chip selector, with an inline "+ New rider" flow that saves to the
  roster for reuse. A full management view (add/deactivate/remove) lives
  in admin Settings, owner-only. `Rider` is intentionally not a foreign key
  on `Order` — see the schema section above for why.
- Configured a real EAS project (`npx eas init`, account `menialshot`) so
  Expo push tokens can actually be minted — previously silently failed
  with no EAS project configured (see Roadmap history).
- Documented (below, "Running the mobile app across networks") the move
  from Expo's built-in `--tunnel` (ngrok-based, repeatedly flaky) to two
  `cloudflared` tunnels + `EXPO_PACKAGER_PROXY_URL` for cross-network
  device testing.

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
- Wired the admin Customers page to `GET /admin/customers` (previously 6
  hardcoded rows). A new signup shows up immediately with 0 orders/GHS 0
  spent, both updating live as they actually order — nothing here is
  precomputed or cached.
- **Decoupled `paid` from `status` on `Order`.** Previously a successful
  Paystack charge auto-advanced `status` to `PREPARING`, which conflicted
  with status being purely admin-controlled. Now `paid` is its own boolean,
  flipped only by `verifyPayment`/`paystackWebhook`; `status` only ever
  changes via `updateOrderStatus`. Expanded `OrderStatus` from
  `PENDING|PREPARING|OUT_FOR_DELIVERY|DELIVERED|CANCELLED` to
  `NEW|PREPARING|READY|OUT_FOR_DELIVERY|COMPLETED|CANCELLED` (added a
  `READY` "packed, waiting for a rider" stage).
- **Real push notifications for order status.** Added `User.pushToken` +
  `PUT /auth/push-token`; `registerForPushNotifications()` runs on the
  mobile app right after sign-in (native only — `expo-notifications` has no
  web support, split into `push.native.ts`/`push.web.ts`). Every
  `updateOrderStatus` call now sends the customer a real Expo push (plain
  `fetch` to `exp.host/--/api/v2/push/send`, no SDK) with a
  status-appropriate message; fire-and-forget, so a push failure never
  blocks the status update itself.
- Wired the admin Orders page to `GET /admin/orders` +
  `PUT /admin/orders/:id/status` (previously a hardcoded `SEED` array).
  Accept/decline/advance buttons drive real status transitions with
  optimistic UI updates (reconciled by an 8s poll on failure). The existing
  paid/cash-on-delivery badge now reflects real data with no UI changes
  needed, since `payment`/`paid` were already real `Order` columns.