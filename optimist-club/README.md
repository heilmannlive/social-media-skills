# The Optimist Club

The digital home of **The Optimist Club** — a private community restoring confidence, agency, and intellectual courage in Germany and Europe. The club convenes entrepreneurs, athletes, executives, and public leaders who prefer building to complaining; this app runs its day-to-day life: events, member administration, internal communication, and membership dues.

## Features

- **Public site & charter** — landing page with the club's charter, membership information, and application entry point.
- **Applications & invitations** — apply directly or join with an invite code; the board reviews and approves every application.
- **Member directory** — private, searchable profiles (role, organization, city, expertise) for a high-trust community.
- **Events** — salons and roundtables with capacity limits, RSVPs, and waitlists; admins publish and manage attendance.
- **Announcements** — club-wide and board-only announcements, with pinning.
- **Notifications** — in-app notification center for RSVPs, approvals, announcements, and payment updates.
- **Membership dues** — €240/year, payable via Stripe Checkout or bank transfer; board tracks payment status per membership year.
- **Administration** — member/application management, invite codes, event administration, payment reconciliation.
- **PWA** — installable on iOS and Android with a rising-sun app icon, standalone display, and a minimal offline-tolerant service worker.

## Quickstart

```bash
cp .env.example .env    # defaults work out of the box for local development
npm install
npm run db:push         # create the SQLite database from the Prisma schema
npm run db:seed         # demo accounts, events, and an invite code
npm run dev             # http://localhost:3000
```

### Seed accounts

All seed accounts use the password `optimist2026`.

| Email                          | Role    | Notes                              |
| ------------------------------ | ------- | ---------------------------------- |
| `admin@optimists-club.com`     | ADMIN   | Full administration                |
| `board@optimists-club.com`     | BOARD   | Member/event/payment management    |
| `member@optimists-club.com`    | MEMBER  | Regular active member              |
| `applicant@optimists-club.com` | PENDING | Application awaiting board review  |

Seeded invite code: `EUROPE-2026` (grants MEMBER on redemption, 25 uses).

## Architecture

- **Next.js 15 (App Router) + React 19 + TypeScript strict.** Server components by default; mutations are server actions (`"use server"`) validated with zod, with authorization re-checked inside every action.
- **Prisma 6 + SQLite** in development (zero external services). Production switches to **Postgres** by changing the datasource provider and `DATABASE_URL` — no schema changes needed (string enums are used deliberately). See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
- **Auth:** custom signed-cookie sessions (JWT, HS256 via `jose`), bcrypt password hashing. Middleware does an edge-safe signature check; pages re-check role/status against the database on every request.
- **Route groups:** `(public)` landing page, `(auth)` login/join/pending, `(member)` member area behind `requireUser()`, `/admin` behind `requireRole("BOARD")`.
- **Stripe (optional):** when `STRIPE_SECRET_KEY` is unset, dues fall back to bank-transfer instructions. Webhook at `/api/stripe/webhook` marks payments as paid.
- **PWA:** `public/manifest.webmanifest`, icons in `public/icons/`, and a conservative service worker (`public/sw.js`) — cache-first for icons/manifest, network-first for page navigations, never touches `/api`.
- **Styling:** Tailwind CSS v4 with a custom theme (navy, gold, warm paper) and a small shared UI kit in `src/components/ui.tsx`.

## Environment variables

| Variable                | Required | Description                                                                 |
| ----------------------- | -------- | --------------------------------------------------------------------------- |
| `AUTH_SECRET`           | Yes (prod) | Secret for signing session cookies. Generate with `openssl rand -hex 32`. A dev fallback exists but production refuses to start without it. |
| `DATABASE_URL`          | Yes      | Prisma database URL. `file:./dev.db` for SQLite dev; a Postgres URL in production. |
| `STRIPE_SECRET_KEY`     | No       | Enables Stripe Checkout for dues. Unset = bank-transfer instructions.       |
| `STRIPE_WEBHOOK_SECRET` | No       | Signing secret for `/api/stripe/webhook`. Required when Stripe is enabled.  |
| `APP_URL`               | No       | Public base URL used for Stripe redirects, e.g. `https://optimists-club.com`. Defaults to `http://localhost:3000`. |

## npm scripts

| Script            | Purpose                                    |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Start the dev server                       |
| `npm run build`   | Production build                           |
| `npm run start`   | Serve the production build                 |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`)        |
| `npm run db:push` | Push the Prisma schema to the database     |
| `npm run db:generate` | Regenerate the Prisma client           |
| `npm run db:seed` | Seed demo data (accounts, events, invite)  |

## Further reading

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — deploying to Vercel or a VPS, Postgres migration, Stripe live setup, DNS.
- [docs/MOBILE.md](docs/MOBILE.md) — installing the PWA on iOS/Android and the path to native store apps.
