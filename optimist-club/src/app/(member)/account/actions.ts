"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, passwordVersion, requireUser, verifyPassword } from "@/lib/auth";
import { createSession } from "@/lib/session";

// Turn an empty/whitespace-only string into null, trim otherwise.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));

const profileSchema = z.object({
  name: z.string().trim().min(2, "name").max(120, "name"),
  title: optionalText(120),
  organization: optionalText(160),
  city: optionalText(120),
  country: optionalText(120),
  phone: optionalText(40),
  linkedinUrl: z
    .string()
    .trim()
    .max(300)
    .transform((v) => (v === "" ? null : v))
    .refine((v) => v === null || /^https:\/\/([\w-]+\.)*linkedin\.com\//i.test(v), {
      message: "linkedin",
    }),
  expertise: z
    .string()
    .trim()
    .max(500)
    .transform((v) => {
      const tags = v
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      return tags.length > 0 ? tags.join(", ") : null;
    }),
  bio: optionalText(2000),
});

export async function updateProfile(formData: FormData): Promise<void> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    name: formData.get("name") ?? "",
    title: formData.get("title") ?? "",
    organization: formData.get("organization") ?? "",
    city: formData.get("city") ?? "",
    country: formData.get("country") ?? "",
    phone: formData.get("phone") ?? "",
    linkedinUrl: formData.get("linkedinUrl") ?? "",
    expertise: formData.get("expertise") ?? "",
    bio: formData.get("bio") ?? "",
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const code = issue?.message === "linkedin" ? "profile-linkedin" : "profile-invalid";
    redirect(`/account?error=${code}`);
  }

  await db.user.update({ where: { id: user.id }, data: parsed.data });

  revalidatePath("/account");
  revalidatePath("/members");
  revalidatePath(`/members/${user.id}`);
  redirect("/account?saved=profile");
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10).max(200),
});

export async function changePassword(formData: FormData): Promise<void> {
  const user = await requireUser();

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword") ?? "",
    newPassword: formData.get("newPassword") ?? "",
  });

  if (!parsed.success) {
    redirect("/account?error=password-short");
  }

  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!ok) {
    redirect("/account?error=password-wrong");
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  // The pwv check in getCurrentUser invalidates every session issued before
  // this change; re-issue this browser's session so the user stays signed in.
  await createSession({ userId: user.id, role: user.role, pwv: passwordVersion(newHash) });

  redirect("/account?saved=password");
}
