# The Optimists Club

The digital home of **The Optimists Club** — a private community restoring confidence, agency, and intellectual courage in Germany and Europe. The club convenes entrepreneurs, athletes, executives, and public leaders who prefer building to complaining; this app runs its day-to-day life: events, member administration, internal communication, and membership dues.

## Getting started (for beginners)

New to running code? This walks you through it from zero. You'll copy the app onto your own computer and run it privately — nothing is published to the internet. Everything happens in a **terminal** (a text window for typing commands): on **Mac** open the *Terminal* app; on **Windows** open *PowerShell*.

**1. Install two tools (once).**

- **Node.js** — runs the app. Download the "LTS" version from <https://nodejs.org> and install it. This also gives you the `npm` command.
- **Git** — downloads the code. Get it from <https://git-scm.com/downloads> (Mac usually has it already).

Check they worked — type each line, press Enter, and expect a version number:

```bash
node --version
git --version
```

**2. Download the code and step into the app folder.**

```bash
git clone https://github.com/heilmannlive/social-media-skills.git
cd social-media-skills/optimist-club
```

`cd` means "change directory" — like double-clicking into a folder, but by typing. Every command below runs _inside_ this folder.

**3. Set it up and start it.** Run these **one at a time**, waiting for each to finish:

```bash
cp .env.example .env    # copies the default settings (works as-is for local use)
npm install             # downloads the app's building blocks (~1-2 min the first time)
npm run db:push         # creates a local database file
npm run db:seed         # fills it with demo members, events, and login accounts
npm run dev             # starts the app
```

When you see `Local: http://localhost:3000`, the app is running (the terminal will stay busy — that's normal).

**4. Open it.** In your web browser, go to **<http://localhost:3000>** (`localhost` just means "this computer"). Click **Member sign in** and use any [seed account below](#seed-accounts) — password `optimist2026`. Or click **Apply to join** and enter invite code `EUROPE-2026` to be admitted instantly.

**Stopping and restarting.** Click the terminal and press **Ctrl + C** to stop. To start again later you only need:

```bash
cd social-media-skills/optimist-club
npm run dev
```

**If something goes wrong.**

- `command not found: npm` → Node.js isn't installed, or restart the terminal after installing it.
- `port 3000 is already in use` → the app is already running in another terminal; use that one, or press Ctrl + C there first.
- A page shows an error or odd data → reset the demo data: press Ctrl + C, then run `npm run db:seed`, then `npm run dev` again.
- Nothing loads → check the terminal still shows it running, and that you typed `http://` (not `https://`).

Once you're comfortable, the [Quickstart](#quickstart) below is the same steps in short form.

## Features

- **Public site & charter** — landing page with the club's charter, membership information, and application entry point.
- **Applications & invitations** — apply directly or join with an invite code; the board reviews and approves every application.
- **Member directory** — private, searchable profiles (role, organization, city, expertise) for a high-trust community.
- **Events** — salons and roundtables with capacity limits, RSVPs, and waitlists; admins publish and manage attendance.
- **Announcements** — club-wide and board-only announcements, with pinning.
- **Notifications** — in-app notification center for RSVPs, approvals, announcements, and payment updates.
- **Membership dues** — €240/year, payable via Stripe Checkout or bank transfer; board tracks payment status per membership year.
- **Administration** — member/application management, invite codes, event administration, payment reconciliation.
- **PWA** — installable on iOS and Android with the club's three-leaf app icon, standalone display, and a minimal offline-tolerant service worker.

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
- **Styling:** Tailwind CSS v4 with the brand theme — Neon Blue `#005EFF`, IEG Deep Blue `#002D57`, Neon Green `#32FE6B`, Beige `#E5E3D3`, Light Grey Blue `#87C4FF` — and a small shared UI kit in `src/components/ui.tsx`.

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
