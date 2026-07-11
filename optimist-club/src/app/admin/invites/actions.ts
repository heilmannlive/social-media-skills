"use server";

import { randomInt } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

// Readable invite codes: an optimistic word plus 4 unambiguous characters,
// e.g. "EUROPE-7KDQ". No 0/O/1/I/L to keep them easy to read aloud.
const WORDS = [
  "EUROPE",
  "AURORA",
  "SUMMIT",
  "HORIZON",
  "MERIDIAN",
  "ATLAS",
  "ZENITH",
  "VOYAGE",
  "BEACON",
  "SUNRISE",
];
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateInviteCode(): string {
  const word = WORDS[randomInt(WORDS.length)];
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `${word}-${suffix}`;
}

const createInviteSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .max(32)
    .refine((v) => v === "" || /^[A-Z0-9][A-Z0-9-]{2,30}[A-Z0-9]$/.test(v), {
      message: "code",
    }),
  role: z.enum(["MEMBER", "BOARD"]),
  maxUses: z.coerce.number().int().min(1).max(500),
  expiresInDays: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 365), {
      message: "expiry",
    }),
});

/** ADMIN only: mint a new invitation code. */
export async function createInvite(formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");

  const parsed = createInviteSchema.safeParse({
    code: formData.get("code") ?? "",
    role: formData.get("role"),
    maxUses: formData.get("maxUses") ?? "1",
    expiresInDays: formData.get("expiresInDays") ?? "",
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const code =
      issue?.message === "code"
        ? "invalid-code"
        : issue?.message === "expiry"
          ? "invalid-expiry"
          : "invalid-input";
    redirect(`/admin/invites?error=${code}`);
  }

  const code = parsed.data.code || generateInviteCode();

  const existing = await db.inviteCode.findUnique({ where: { code } });
  if (existing) {
    // A custom code collided, or (astronomically unlikely) a generated one did.
    redirect("/admin/invites?error=code-taken");
  }

  const expiresAt = parsed.data.expiresInDays
    ? new Date(Date.now() + parsed.data.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  await db.inviteCode.create({
    data: {
      code,
      role: parsed.data.role,
      maxUses: parsed.data.maxUses,
      expiresAt,
      createdById: actor.id,
    },
  });

  revalidatePath("/admin/invites");
  redirect(`/admin/invites?created=${encodeURIComponent(code)}`);
}
