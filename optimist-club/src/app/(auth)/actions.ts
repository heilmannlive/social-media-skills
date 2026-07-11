"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, passwordVersion, verifyPassword } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { notifyMembers } from "@/lib/notifications";

/**
 * Only allow same-origin relative paths as post-login destinations:
 * must start with exactly one "/" and contain no backslashes anywhere —
 * browsers normalize "\" to "/" when parsing URLs, so "/\evil.com" (and
 * friends) would become the protocol-relative external URL "//evil.com".
 */
function safeNextPath(next: string): string {
  if (/^\/(?![/\\])/.test(next) && !next.includes("\\")) return next;
  return "/dashboard";
}

// ---------------------------------------------------------------------------
// Sign in
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

function loginFail(error: string, next: string): never {
  const params = new URLSearchParams({ error });
  if (next) params.set("next", next);
  redirect(`/login?${params.toString()}`);
}

export async function login(formData: FormData): Promise<void> {
  const rawNext = formData.get("next");
  const next = typeof rawNext === "string" ? rawNext : "";

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) loginFail("invalid", next);

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // Never reveal whether the email exists: same message for both failures.
  if (!user) loginFail("credentials", next);
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) loginFail("credentials", next);

  if (user.status === "SUSPENDED") loginFail("suspended", next);

  await createSession({
    userId: user.id,
    role: user.role,
    pwv: passwordVersion(user.passwordHash),
  });
  redirect(safeNextPath(next));
}

// ---------------------------------------------------------------------------
// Membership application (/join)
// ---------------------------------------------------------------------------

const applySchema = z.object({
  name: z.string().trim().min(2, "name").max(120, "name"),
  email: z.string().trim().toLowerCase().email("email").max(200, "email"),
  password: z.string().min(10, "password").max(200, "password"),
  title: z.string().trim().min(2, "title").max(120, "title"),
  organization: z.string().trim().min(2, "organization").max(160, "organization"),
  city: z.string().trim().min(2, "city").max(120, "city"),
  country: z.string().trim().min(2, "country").max(120, "country"),
  bio: z.string().trim().min(10, "bio").max(2000, "bio"),
  inviteCode: z
    .string()
    .trim()
    // Codes are stored uppercase (see admin/invites); accept any casing here.
    .toUpperCase()
    .max(120)
    .optional()
    .transform((v) => v || undefined),
});

/** Fields echoed back into the form after a validation redirect (never the password). */
const ECHO_FIELDS = [
  "name",
  "email",
  "title",
  "organization",
  "city",
  "country",
  "bio",
  "inviteCode",
] as const;

function joinFail(error: string, formData: FormData): never {
  const params = new URLSearchParams({ error });
  for (const key of ECHO_FIELDS) {
    const value = formData.get(key);
    if (typeof value === "string" && value) params.set(key, value.slice(0, 2000));
  }
  redirect(`/join?${params.toString()}`);
}

const CODE_EXHAUSTED = "OC_INVITE_CODE_EXHAUSTED";

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export async function apply(formData: FormData): Promise<void> {
  const parsed = applySchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    title: formData.get("title"),
    organization: formData.get("organization"),
    city: formData.get("city"),
    country: formData.get("country"),
    bio: formData.get("bio"),
    inviteCode: formData.get("inviteCode") ?? undefined,
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.message;
    joinFail(field === "password" ? "password" : "invalid", formData);
  }
  const data = parsed.data;

  // Emails are stored lowercased; always query lowercased too.
  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) joinFail("email_taken", formData);

  const passwordHash = await hashPassword(data.password);
  const profile = {
    email: data.email,
    passwordHash,
    name: data.name,
    title: data.title,
    organization: data.organization,
    city: data.city,
    country: data.country,
    bio: data.bio,
  };

  if (data.inviteCode) {
    const invite = await db.inviteCode.findUnique({ where: { code: data.inviteCode } });
    if (!invite) joinFail("code_invalid", formData);
    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      joinFail("code_expired", formData);
    }
    if (invite.usedCount >= invite.maxUses) joinFail("code_exhausted", formData);

    let userId: string;
    try {
      userId = await db.$transaction(async (tx) => {
        // Claim a use atomically: the usedCount-still-below-max condition
        // makes concurrent redemptions race safely — losers update 0 rows.
        const claimed = await tx.inviteCode.updateMany({
          where: { id: invite.id, usedCount: { lt: invite.maxUses } },
          data: { usedCount: { increment: 1 } },
        });
        if (claimed.count === 0) throw new Error(CODE_EXHAUSTED);

        const user = await tx.user.create({
          data: {
            ...profile,
            role: invite.role,
            status: "ACTIVE",
            memberSince: new Date(),
          },
        });
        return user.id;
      });
    } catch (err) {
      if (err instanceof Error && err.message === CODE_EXHAUSTED) {
        joinFail("code_exhausted", formData);
      }
      if (isUniqueViolation(err)) joinFail("email_taken", formData);
      throw err;
    }

    await createSession({ userId, role: invite.role, pwv: passwordVersion(passwordHash) });
    redirect("/dashboard");
  }

  // No invite code: create a pending application for board review.
  let userId: string;
  try {
    const user = await db.user.create({
      data: { ...profile, role: "PENDING", status: "PENDING" },
    });
    userId = user.id;
  } catch (err) {
    if (isUniqueViolation(err)) joinFail("email_taken", formData);
    throw err;
  }

  await notifyMembers(
    {
      title: "New membership application",
      body: `${data.name} — ${data.organization}`,
      href: "/admin/members",
    },
    // Board members review applications, so they get the notification too.
    { minRole: "BOARD" }
  );

  await createSession({ userId, role: "PENDING", pwv: passwordVersion(passwordHash) });
  redirect("/pending");
}
