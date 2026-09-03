# Burger Yard — Backend

Express + TypeScript API backing the Burger Yard customer app (and, eventually,
the admin console). Prisma ORM (v7, driver adapters) on PostgreSQL.

## ✅ Resolved — a real secret was pushed to GitHub (2026-08-30)

`mobile/.env` was committed with the real local Postgres password
(`DATABASE_URL`) and a Paystack **test** secret key. Both the actual
exposure and its traces have been dealt with:

- **Password rotated** — the exposed Postgres password no longer works;
  the database now uses a new one (in `backend/.env`, not committed).
- **History scrubbed** — `mobile/.env` was stripped from every commit on
  `main` and `feature/burger-yard-updates` with `git filter-repo`, then
  force-pushed. Verified against a fresh mirror clone pulled directly from
  GitHub: `git log --all --oneline -- mobile/.env` is empty. This rewrote
  commit SHAs on those branches (`front` never contained the file, so it
  was untouched) — **anyone with an existing local clone needs to
  re-clone, or `git fetch && git reset --hard origin/<branch>` on each
  branch they track**, since their old history now conflicts with what's
  on GitHub.
- `backend/.env` and the root `.env` were checked and were never committed.

One caveat worth knowing: a force-push rewrites what GitHub serves for the
repo going forward, but doesn't retroactively erase anything a fork, a
cached page, or a scraper already captured before the rewrite. The
password rotation is what actually closes that door regardless.

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
  `image_url`/`category` (nullable), and `available` (default `true`) —
  hides an item from the customer-facing menu without deleting it, which
  matters because `OrderItem` has a real FK to `MenuItem`: an item with
  past orders can't be hard-deleted without breaking those orders' line
  items, so `deleteMenuItem` hides it instead when that's the case (see
  API surface below).
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
| `GET /api/customer/menu` | Public. Only `available: true` items. **Now actually used** — the customer app fetches this once at startup (`AppStoreProvider`) and caches it in `constants/catalog.ts`'s `getProducts()`; previously the whole customer app (home, menu, product detail, search) rendered a hardcoded local catalog that never reflected real admin changes at all |
| `POST /api/customer/orders` | Place an order from the cart |
| `GET /api/customer/orders/:id`, `/users/me/orders` | Order lookup / history |
| `GET/POST/PUT/DELETE /api/addresses`, `PATCH /:id/default` | Address book CRUD |
| `POST /api/payments/initialize` | Starts a Paystack transaction for an order |
| `GET /api/payments/verify/:reference` | Authoritative payment status check (see above) |
| `POST /api/payments/webhook` | Paystack webhook (production path) |
| `GET /api/places/nearby-landmark` | Map-tap → landmark + city lookup |
| `GET /api/admin/orders`, `PUT /api/admin/orders/:id/status` | Staff-or-owner. `getAllOrders` and the status update both `omit` `deliveryCode`. A status update sends the customer a real Expo push notification (see below) |
| `GET/POST/PUT/DELETE /api/admin/menu` | Staff-or-owner. `GET` returns every item (including hidden ones) with a real "sold in the last 7 days" count computed from `OrderItem`. `DELETE` hard-deletes only if the item has zero past orders — otherwise it falls back to hiding it (`available: false`) and tells the frontend so, since hard-deleting would break the receipt on those past orders |
| `POST /api/admin/uploads/image` | Staff-or-owner. Multipart image upload (field `image`, ≤5MB, JPEG/PNG/WEBP/GIF only) for the menu photo picker — saves to `backend/uploads/` and returns `{ url }`, built from the request's own host so it resolves correctly through a cloudflared tunnel too. Served back via `express.static` at `/uploads/*` |
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
| `GET /api/admin/payments` | Owner-only. Every order reshaped as a payment record (no separate Payment table — see schema notes) with a derived status (`Paid`/`Awaiting payment`/`Cash on delivery`/`Cancelled`), plus total collected, cash outstanding, and amount awaiting online confirmation. Cancelled orders are included deliberately — a paid, cancelled order still needs a refund |

## Roadmap — what's still ahead

Admin auth (owner login + staff PIN login), the Customers, Orders,
Dashboard, Reports, Menu, and Payments pages are now real, and the
customer app's menu is now live-backed too — see Changelog. What's still
mock or unbuilt:

- Uploaded menu photos are stored on the **backend's local disk**
  (`backend/uploads/`, gitignored), served via a static route. Simple and
  needs no third-party account, but not durable on a host with an
  ephemeral filesystem (e.g. a free-tier PaaS that wipes disk on
  redeploy) — worth moving to real object storage (S3, Cloudinary, etc.)
  before a production deploy on that kind of host.
- A Google Maps SDK for Android key is now set in `app.json`
  (`android.config.googleMaps.apiKey`), but **it has no effect in Expo
  Go** — Expo Go is a fixed, pre-built shell shared by every Expo project
  and can't inject a project's own native config into its manifest at
  runtime. Only a real native build (`eas build`, or `expo prebuild` +
  local build) actually reads this. Android's map stays blank under Expo
  Go regardless of this key until such a build exists.
- No **Failed**/**Refunded** payment tracking — nothing currently records
  a failed Paystack charge or an issued refund, so the Payments page can
  only ever show `Paid`/`Awaiting payment`/`Cash on delivery`/`Cancelled`.
  A cancelled-but-paid order is visible (so the admin knows a refund is
  owed) but nothing tracks whether that refund actually happened yet.
- An EAS project is now configured (`extra.eas.projectId` in `app.json`,
  under the `menialshot` Expo account), so `getExpoPushTokenAsync()` can
  actually mint real tokens in Expo Go — no custom dev build required
- Per the current plan, the admin console ships as its **own web-only
  build** at a separate URL — never bundled into the customer app that goes
  to the app stores
- **No rider-facing interface exists yet.** The admin picks a rider from the
  saved roster (or adds a new one) and it's written onto the order via
  `updateOrderStatus`. Delivery-code verification (see Changelog) closes
  part of the gap this created, but real-time rider location on the
  tracking map is still blocked on there being no rider-facing app at all.

## Changelog

Log major backend changes here going forward — schema changes, new
integrations, new endpoints, breaking changes to existing ones.

### 2026-09-01
- **Replaced the menu photo URL text field with a real picker.** Added
  `POST /admin/uploads/image` (multer, disk storage under
  `backend/uploads/`, gitignored, served via `express.static`) with
  size/type validation returning clean JSON errors rather than falling
  through to Express's default HTML error page. New
  `mobile/components/admin/image-upload.{native,web}.ts` opens the
  system photo picker (native: `expo-image-picker`; web: a plain
  `<input type="file">`) — both surface whatever cloud-drive providers
  the OS/browser itself integrates (Google Drive, iCloud, etc.), which is
  an OS-level capability, not something built here — and uploads the
  result. Confirmed live: valid image uploads and serves back correctly;
  a non-image upload is cleanly rejected with a 400.
- **Wired the admin Payments page to real data** (`GET /admin/payments`,
  owner-only), replacing the hardcoded `TXNS` array. Every order is
  reshaped into a payment row with a derived status — `Paid`, `Awaiting
  payment` (MoMo/Card not yet confirmed), `Cash on delivery`, or
  `Cancelled` — computed from the same `paid`/`paymentMethod`/`status`
  fields already on `Order` (no separate Payment table, per the schema
  notes). Dropped the mock's `Failed`/`Refunded` statuses since nothing
  tracks either yet (see Roadmap); cancelled orders are shown rather than
  filtered out, since a paid-then-cancelled order still needs a refund.
  Stats (`total collected`, `cash outstanding`, `awaiting payment`) are
  computed server-side from the same rows. Confirmed live against real
  order data.
- **A successful payment now shows up on the admin side, two ways.**
  `NewOrdersProvider`'s existing poll now also tracks which order ids it's
  seen *paid*, not just which ids it's seen — a MoMo/Card order flipping
  `paid: false → true` (a real Paystack confirmation; cash orders never
  do this) fires the same loud banner-and-beep alert already built for
  new orders. The alert component moved from `new-order-alert.tsx` to
  `admin-alert-banner.tsx` (`AdminAlertBanner`) so one banner covers both
  event kinds. Separately, every row in the Orders list now shows a Paid
  (green) / Pending (amber) / COD (grey) badge next to the total —
  previously payment status was only visible after opening an order's
  detail panel. Confirmed live: simulated a MoMo order's payment
  confirming and traced the exact `paid: false → true` transition the
  poll-diff logic and the list badge both key off.
- **The delivery code is now actually verified before an order can be
  marked delivered.** `updateOrderStatus` rejects `OUT_FOR_DELIVERY →
  COMPLETED` (400, "Incorrect delivery code.") unless the request's
  `deliveryCode` matches the order's stored one — the code itself is
  never sent back in the response or exposed on any admin-facing query,
  preserving the existing invariant (the admin can *check* it, never
  *see* it; whoever's at the door has to actually ask the customer for
  it). The admin Orders screen shows a 4-digit input once an order is
  "Out for delivery," blocks "Mark delivered" until 4 digits are entered,
  and surfaces a wrong-code rejection inline. Confirmed live: wrong code
  → 400, correct code → 200, delivery details still absent from the
  response either way.
- **Removed the fake mock map on order-tracking** (a static grey box with
  a decorative line and a red dot — never real, per the earlier "skip
  live tracking for now" call) and expanded the status timeline to show
  a real time next to each completed stage instead of just a dot. Added
  `Order.outForDeliveryAt` (stamped by `updateOrderStatus`, same pattern
  as `acceptedAt`/`readyAt`) so every stage now has a real timestamp:
  `createdAt` → placed, `acceptedAt` → preparing, `readyAt` → ready,
  `outForDeliveryAt` → out for delivery, `updatedAt` → delivered (accurate
  since nothing else changes on an order after completion). Confirmed
  live by advancing a test order through the whole flow.
- **Checkout's map now works on all three platforms, plus tap-to-select,
  full-screen expand, and "use my location."** iOS uses Apple Maps (free,
  no key, already worked); Android uses `react-native-maps`'s default
  Google Maps provider, which needs a Google Maps SDK for Android key to
  actually render tiles — not set up yet, deliberately deferred, so
  Android's map stays blank until that key is added to `app.json`. New
  behavior on every platform that does render: tapping/clicking a point
  on the map pans there directly (native `MapView.onPress` /
  `animateToRegion`, web Leaflet `click` → `panTo`) instead of only
  dragging the whole map under a fixed center pin; an expand icon opens
  the same map in a full-screen `Modal`; a target icon calls
  `expo-location` (native) or the browser Geolocation API (web) to jump
  straight to the device's current position and auto-run the landmark
  lookup there.
- **Fixed a "window is not defined" crash on web, introduced by the map
  change below** — then fixed the fix. `location-map.web.tsx` imported
  `leaflet` (and its CSS) at module scope; leaflet touches `window` the
  instant it's imported, but Expo Router's static web build pre-renders
  every route in Node first (no `window`), so that crashed `/checkout`
  immediately. First attempt moved both imports to dynamic `import()`
  inside `useEffect` (which never runs during that server pass) — this
  fixed the crash but caused a separate "Requiring unknown module" error
  from Metro's async-chunk machinery in this project's web setup.
  Replaced with a synchronous `require()` call inside the same
  `useEffect` instead: it stays in the main bundle (no async chunk at
  all), while still only *executing* after mount in a real browser.
  Confirmed clean by hitting `/checkout` directly against the dev server.
- **Checkout now has a real, working map embedded directly on the page**
  (previously a static grey placeholder box with "Change" linking out to
  a separate screen — that screen, `select-location.tsx`, is now removed
  since it's fully replaced by the inline version). Dragging the map and
  tapping "Use this spot" looks up a real landmark and sets it directly.
- **The landmark lookup is now genuinely real on both platforms, for
  free.** `GOOGLE_PLACES_API_KEY` has been empty this whole time, so
  `getNearbyLandmark` was silently returning a fake `"Pinned location
  (lat, lng)"` placeholder for every single request — this was never
  caught because it "worked" (returned *something*). It now falls back to
  free OpenStreetMap Nominatim reverse geocoding when no Google key is
  set, no account/billing needed. Confirmed live: real results like
  "Adiebeba, Kumasi" and "Patrice Lumumba Road, Accra" instead of the
  placeholder. Google is still used automatically once a real
  `GOOGLE_PLACES_API_KEY` is set — this only changes the no-key fallback.
- **Added a real web map.** `react-native-maps` (used on native, via
  `location-map.native.tsx`) has no web renderer at all — the web version
  of that component was just a "not available on web" placeholder. It now
  uses Leaflet against public OpenStreetMap tiles (new `leaflet` +
  `@types/leaflet` deps) — free, keyless, and it's what checkout's inline
  map actually renders in a browser now.

### 2026-08-30
- **An order can no longer be sent out without a rider assigned.**
  `updateOrderStatus` rejects a `READY → OUT_FOR_DELIVERY` transition
  (400, "Assign a rider before sending this order out for delivery.")
  unless `riderName` is already on the order or included in that same
  request. The admin Orders screen also disables the "Send out" button
  and shows the same reasoning inline, so the rejection is a backend
  safety net, not the primary way the admin finds out. Confirmed live:
  blocked with no rider, succeeded immediately after assigning one.
- **Added a loud new-order alert to the admin console.** A `NewOrdersProvider`
  (`mobile/context/NewOrdersContext.tsx`) polls `GET /admin/orders` every 8s
  from the admin layout — active on every admin screen, not just Orders —
  and diffs against what it's seen before. A genuinely new "New"-status
  order triggers a banner (customer, order id, total, a "View" button that
  deep-links straight to that order) plus a repeating Web Audio beep that
  doesn't stop until dismissed or viewed, so it can't be missed while
  away from the screen. The first poll after signing in only records a
  baseline silently — it doesn't alert on orders already sitting there.
  Also replaced the sidebar's hardcoded "4" badge on Orders with the same
  real New-order count.
- **Closed two gaps around items going out of stock.** `placeOrder` now
  rejects an order containing an unavailable `MenuItem` with a clear
  message (`"{name} is no longer available..."`, 400) — previously it only
  checked the item still existed, not whether it was still available, so a
  stale cart (the app only fetches the menu once at startup, not on every
  checkout) could still be ordered. Confirmed live: created a test item,
  marked it unavailable, attempted to order it, got the rejection.
  On the client, the cart screen now flags a line whose product isn't in
  the live menu anymore ("No longer available", dimmed, quantity stepper
  replaced with Remove) and disables "Proceed to Checkout" until it's
  removed — `findProduct()` (new, returns `null` instead of a wrong
  fallback item) added to `catalog.ts` alongside a new `removeLine()` on
  the cart context.

### 2026-08-29
- Fixed the live customer menu (added same day, above) using the wrong
  photo set for the 9 seeded items — it was falling back through
  `menu-catalog.ts`'s admin-side images instead of this app's own real
  product photography in `constants/catalog.ts`. Since the seeded
  `MenuItem` rows share both id and name with `PRODUCTS` by design,
  `setLiveMenu` now matches by id first (name as a backup) and reuses that
  entry's real `image`/`fit` — a brand-new admin-added item with no
  `image_url` still falls back to a generic placeholder, as before.
- **Wired the admin Menu page to real data** (`GET/POST/PUT/DELETE
  /admin/menu`), replacing the hardcoded `SEED` array. Added `MenuItem.available`.
  The category picker is dynamic (chips from whatever categories already
  exist, plus free text for a new one) instead of a fixed list. "Sold (7d)"
  is now read-only, computed server-side — it was previously a hand-typeable
  number in the mock's edit form, which never made sense for real data.
  `DELETE` hard-deletes only when nothing ever ordered the item, otherwise
  hides it — confirmed live that deleting an item with order history falls
  back correctly instead of breaking those orders' line items.
- **Found and fixed a bigger gap while building this: the customer app's
  menu was never actually connected to the backend at all.** `home.tsx`,
  `(tabs)/menu.tsx`, `product-detail.tsx`, and `search-favorites.tsx` all
  rendered a fully hardcoded local catalog (`constants/catalog.ts`) — so
  every admin menu change (including the new add/edit/delete flow above)
  would have been invisible to real customers. Fixed by having
  `AppStoreProvider` fetch `GET /customer/menu` once on app start and cache
  it in `catalog.ts` (`setLiveMenu`/`getProducts`/`getCategories`), which
  `getProduct()` — and therefore `addItem()`/cart/checkout — now reads
  through transparently. Confirmed end-to-end live: an item created via
  the admin API immediately appeared in `GET /customer/menu`.
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