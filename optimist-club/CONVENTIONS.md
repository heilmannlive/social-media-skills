# Optimist Club — engineering conventions (for all contributors/agents)

Stack: Next.js 15 App Router, React 19, TypeScript strict, Tailwind CSS v4, Prisma 6 + SQLite (dev), custom cookie-session auth. All code and UI copy in **US English**. Tone: confident, warm, serious — never corporate-bland or hype.

## Ownership map (do not edit files outside your module)
- Shared (already written, DO NOT MODIFY): `prisma/schema.prisma`, `src/lib/*`, `src/components/ui.tsx`, `src/components/shell.tsx`, `src/components/logo.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/middleware.ts`.
- Module A (auth): `src/app/(auth)/**` (login, join, pending), `src/app/api/auth/**`
- Module B (members): `src/app/(member)/members/**`, `src/app/(member)/account/**`, `src/app/admin/members/**`, `src/app/admin/invites/**`
- Module C (events): `src/app/(member)/events/**`, `src/app/admin/events/**`
- Module D (payments): `src/app/(member)/membership/**`, `src/app/admin/payments/**`, `src/app/api/stripe/**`
- Module E (comms): `src/app/(member)/announcements/**`, `src/app/(member)/notifications/**`, `src/app/(member)/dashboard/**`, `src/app/admin/announcements/**`
- Module F (public/PWA): `src/app/(public)/**` (landing page at route `/`), `public/**`, `docs/**`, `README.md`

## Layouts & auth
- Member-area pages live under `src/app/(member)/` with a shared layout `src/app/(member)/layout.tsx` (owned by Module E) that calls `requireUser()` and wraps children in `<AppShell user={user}>`.
  - IMPORTANT (all member modules): pages under `(member)` can assume the shell exists. Each page still calls `requireUser()` (or `requireRole`) itself to get the user — it's cached per request via React `cache()`.
  - PENDING/not-ACTIVE users: member pages must call `requireRole("MEMBER")` which redirects them to `/pending`. Intentional exceptions: `/account` and `/notifications` (and their actions) use `requireUser()` only, so PENDING applicants can maintain their application profile and receive status notifications — these operate strictly on the caller's own records.
- Admin pages live under `src/app/admin/` with layout `src/app/admin/layout.tsx` (owned by Module B) calling `requireRole("BOARD")` and wrapping in `<AppShell>`. Destructive/admin-only mutations must check `requireRole("ADMIN")` where noted.
- Public pages under `src/app/(public)/` with their own light layout (Module F owns it).

## Server APIs (from src/lib — import via `@/…`)
- `db` from `@/lib/db` — PrismaClient singleton.
- `hashPassword`, `verifyPassword`, `getCurrentUser()`, `requireUser()`, `requireRole("MEMBER"|"BOARD"|"ADMIN")`, `hasRole(user, role)` from `@/lib/auth`. `requireRole` redirects; never returns for unauthorized users.
- `createSession({userId, role})`, `destroySession()`, `getSessionPayload()` from `@/lib/session`.
- `notifyUser(userId, {title, body?, href?})`, `notifyMembers({...}, {minRole?, excludeUserId?})` from `@/lib/notifications`.
- `isStripeConfigured()`, `getStripe()`, `getAppUrl()`, `MEMBERSHIP_FEE` from `@/lib/stripe`.
- `formatDate`, `formatDateTime`, `formatMoney`, `initials`, `timeAgo` from `@/lib/format`.
- UI kit from `@/components/ui`: `Button`, `ButtonLink`, `Card`, `Input`, `Textarea`, `Select`, `Label`, `Field`, `Badge`, `StatusBadge`, `Avatar`, `PageHeader`, `EmptyState`. Logo: `Wordmark`, `Sunrise` from `@/components/logo`.

## Data model string enums (SQLite: no native enums)
- User.role: PENDING | MEMBER | BOARD | ADMIN; User.status: PENDING | ACTIVE | SUSPENDED
- Rsvp.status: GOING | WAITLIST | DECLINED
- Payment.status: PENDING | PAID | FAILED; Payment.method: STRIPE | TRANSFER | MANUAL; unique (userId, periodYear)
- Announcement.audience: ALL | BOARD

## Mutations
- Prefer **server actions** (`"use server"`) colocated in an `actions.ts` per module; validate inputs with `zod`; re-check authorization inside every action (never trust the page).
- After mutations call `revalidatePath()` for affected routes.
- Only Module A writes `src/app/api/auth/**`; logout MUST be `POST /api/auth/logout` (the shell posts a form there) that destroys the session and 303-redirects to `/`.
- Server actions used from `<form action={...}>` must have signature `(formData: FormData) => Promise<void>` — return `void`, use `redirect()` for navigation. For inline error display, use the `useActionState` pattern with a client component OR redirect with `?error=` query params (keep it simple; query-param errors are fine).

## Style
- Use existing UI kit + Tailwind theme tokens (`navy-*`, `gold-*`, `paper`, `ink`, `font-display`). No new dependencies. No client component unless interactivity requires it.
- Dates via `@/lib/format` helpers, money via `formatMoney`.
- Never render raw user HTML. Plain text with `whitespace-pre-wrap` for bodies.
- Keep pages `export const dynamic = "force-dynamic"` only if needed (pages using cookies/db are dynamic automatically).

## Verification expected from every module
Run `npx tsc --noEmit` inside `optimist-club/` before finishing (ignore errors clearly caused by OTHER modules' missing files, but report them).
