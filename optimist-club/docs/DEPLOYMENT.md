# Deployment

This guide covers taking The Optimist Club from local development to production at **optimists-club.com**.

## 1. Choose a platform

### Option A: Vercel (recommended)

1. Push the repository to GitHub and import it into Vercel.
2. Framework preset: **Next.js** (auto-detected). Build command `next build`, output handled by Vercel.
3. Add a `postinstall` step is not required — Prisma client generation runs via `prisma generate` automatically when `@prisma/client` is installed. If you see a stale-client error, set the build command to `prisma generate && next build`.
4. Configure the environment variables listed below in **Project → Settings → Environment Variables**.
5. Vercel's filesystem is ephemeral — **SQLite will not work there.** Use Postgres (see section 2).

### Option B: VPS (Docker or bare Node)

1. Provision a server with Node 20+ and (recommended) Postgres 15+.
2. Clone the repo, create `.env` (see below), then:

   ```bash
   npm ci
   npx prisma db push
   npm run db:seed        # optional, demo data
   npm run build
   npm run start          # serves on port 3000
   ```

3. Put a reverse proxy (Caddy or nginx) in front for TLS. Caddy example:

   ```
   optimists-club.com {
       reverse_proxy localhost:3000
   }
   ```

4. Run the app under a process manager (systemd unit or `pm2`) so it restarts on reboot.

## 2. Switch SQLite → Postgres

SQLite is for development only. The schema uses string enums deliberately, so no schema surgery is needed:

1. In `prisma/schema.prisma`, change the datasource provider:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Set `DATABASE_URL` to your Postgres connection string, e.g.
   `postgresql://optimist:password@db-host:5432/optimist_club?schema=public`
3. Create the tables:

   ```bash
   npx prisma db push
   ```

4. (Optional) Seed initial data with `npm run db:seed`, then immediately change or remove the seed accounts — they use a published password.
5. Make the member-directory search case-insensitive: unlike SQLite, Postgres `contains` is case-sensitive. In `src/app/(member)/members/page.tsx`, add `mode: "insensitive"` to each `contains` filter, e.g. `{ name: { contains: query, mode: "insensitive" } }` (there is a NOTE comment at the exact spot).

## 3. Environment variables

| Variable                | Production value                                                     |
| ----------------------- | -------------------------------------------------------------------- |
| `AUTH_SECRET`           | Long random secret — generate with `openssl rand -hex 32`. The app **refuses to start in production** without it. |
| `DATABASE_URL`          | Postgres connection string.                                           |
| `APP_URL`               | `https://optimists-club.com` — used to build Stripe redirect URLs.    |
| `STRIPE_SECRET_KEY`     | Live secret key (`sk_live_…`), if card payments are enabled.          |
| `STRIPE_WEBHOOK_SECRET` | Live webhook signing secret (`whsec_…`), if card payments are enabled.|

## 4. Stripe (live)

Stripe is optional; without keys the app shows bank-transfer instructions for dues. To enable card payments:

1. In the [Stripe dashboard](https://dashboard.stripe.com), switch to **live mode** and copy the secret key (`sk_live_…`) into `STRIPE_SECRET_KEY`.
2. Create a webhook endpoint pointing at:

   ```
   https://optimists-club.com/api/stripe/webhook
   ```

   Subscribe it to the event **`checkout.session.completed`** (that is the only event the app consumes — it marks the member's dues as paid).
3. Copy the endpoint's signing secret (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.
4. For local development, forward events with the Stripe CLI:

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

   The CLI prints a temporary `whsec_…` — use it as `STRIPE_WEBHOOK_SECRET` in your local `.env`.

## 5. DNS for optimists-club.com

- **Vercel:** add `optimists-club.com` under **Project → Settings → Domains**, then at your registrar create the records Vercel shows you — typically an `A` record for the apex (`76.76.21.21`) and a `CNAME` for `www` → `cname.vercel-dns.com`. Vercel provisions TLS automatically.
- **VPS:** create an `A` record for the apex (and `www`) pointing at your server's IP. TLS comes from your reverse proxy (Caddy provisions certificates automatically; for nginx use certbot).
- Either way, set `APP_URL=https://optimists-club.com` afterwards so Stripe redirects and absolute links use the real domain.

## 6. Post-deploy checklist

- [ ] `AUTH_SECRET` is a fresh random value, not the example string.
- [ ] Seed accounts removed or passwords rotated.
- [ ] `https://optimists-club.com/manifest.webmanifest` loads (PWA install works).
- [ ] A test application via `/join` reaches the admin review queue.
- [ ] If Stripe is enabled: a test checkout completes and the payment flips to PAID via the webhook.
