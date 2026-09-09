# Burger Yard

Food ordering for a single burger shop in Ghana. One Expo app carries both
halves of the product, the customer storefront and the staff and owner admin
console, and both talk to one Express API over Prisma and PostgreSQL.

Prices are in GHS. Customers sign in with a phone number and an SMS code, pay
by mobile money (MTN, Telecel, AT) or card through Paystack, or pay cash on
delivery.

## Repository layout

```
backend/     Express 5 + TypeScript API, Prisma v7, PostgreSQL
mobile/      Expo (SDK 54) app, expo-router, React Native 0.81
  app/(auth)     welcome, sign in, sign up, OTP
  app/(tabs)     customer storefront: home, menu, cart, you
  app/(admin)    admin console: dashboard, orders, menu, customers,
                 reports, payments, settings
  app/           checkout, tracking, addresses, payment methods, and the
                 rest of the customer screens
```

The admin console is not a separate project. It is a route group inside the
same Expo app, reached through `app/admin-auth.tsx`, so the two audiences ship
as one binary and share the components, theme, and API client.

## Prerequisites

- Node 20 or newer (developed on Node 22)
- PostgreSQL running locally
- The Expo Go app, if you want to run on a real phone

## Getting started

### 1. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

The API listens on port 3000 by default. `GET /api/health` should answer
`{ "status": "ok" }` once it is up.

This project has no Prisma migration history, because it was never started
with `prisma migrate`. Schema changes are applied with `npx prisma db push`.

### 2. Mobile app

```bash
cd mobile
npm install
npx expo start
```

Press `w` for the browser, `i` for the iOS simulator, `a` for Android, or scan
the QR code with Expo Go. `npm run web` starts the web build directly.

You do not need to configure an API URL for local work. `mobile/api.ts` reads
the LAN address Metro is already serving the bundle from and points the API at
port 3000 on that same host, so a phone on the same WiFi as the dev machine
just works and keeps working when the network changes.

## Environment variables

Backend configuration lives in `backend/.env`, which is not committed.

| Variable | Purpose |
|---|---|
| `PORT` | API port, defaults to 3000 |
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Signs auth tokens |
| `PAYSTACK_SECRET_KEY` | Payment initialization, verification, and webhook signature check |
| `ARKESEL_API_KEY` | Sends real OTP SMS. Falls back to logging the code to the console when unset |
| `ARKESEL_SENDER_ID` | Sender name shown on the SMS |
| `GOOGLE_PLACES_API_KEY` | Checkout landmark lookup. Falls back to a placeholder when unset |

Every third party key above is optional for local development. Without them
the OTP prints to the backend console and the landmark lookup returns a
placeholder, so you can run the whole flow with nothing but Postgres.

`mobile/.env` holds `EXPO_PUBLIC_API_URL`, and is only needed when the backend
is not reachable at the address the app derives on its own, for example when
testing across networks through a tunnel.

## Who signs in how

| Role | Credential | Where |
|---|---|---|
| Customer | Phone number plus a 4 digit SMS code | `app/(auth)` |
| Owner | Email and password | `app/admin-auth.tsx` |
| Staff | Their name plus a 4 digit PIN | `app/admin-auth.tsx` |

There is exactly one owner account per business, created directly in the
database rather than through a signup screen. The owner creates staff members,
and a staff PIN is shown in plaintext once at creation or regeneration and is
never retrievable afterward, since only its hash is stored.

Staff and owner see different things. Dashboard, reports, and payments are
owner only, both in the navigation and on the API.

## Testing on a phone that is not on your WiFi

Both the API and Metro have to be reachable from the phone, which means two
`cloudflared` tunnels and an `EXPO_PACKAGER_PROXY_URL` override rather than
Expo's own `--tunnel` flag. The full five terminal procedure is written up in
[backend/README.md](backend/README.md).

## Branches

| Branch | What it is |
|---|---|
| `main` | Default and current. Backend plus the merged customer and admin app |
| `front` | Standalone customer app at the repository root, from before the merge into `mobile/`. Superseded by `main` |
| `feature/burger-yard-updates` | Older admin console snapshot. Superseded by `main` |

`main` had its history rewritten in August 2026 to strip a committed `.env`
file. If you are carrying a clone from before that, re-clone or run
`git fetch && git reset --hard origin/main` rather than trying to merge.

## Further reading

[backend/README.md](backend/README.md) is the detailed document: the full
Prisma schema, every API route and what it guarantees, the payment and push
notification flows, and the running changelog.
