"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";

const idSchema = z.string().min(1).max(64);

function refreshMemberViews(): void {
  revalidatePath("/admin/members");
  revalidatePath("/admin");
  revalidatePath("/members");
}

function done(notice: string): never {
  refreshMemberViews();
  redirect(`/admin/members?notice=${notice}`);
}

function fail(error: string): never {
  redirect(`/admin/members?error=${error}`);
}

/** BOARD+: turn a pending application into an active membership. */
export async function approveApplication(formData: FormData): Promise<void> {
  await requireRole("BOARD");

  const parsed = idSchema.safeParse(formData.get("userId"));
  if (!parsed.success) fail("not-found");

  const target = await db.user.findUnique({ where: { id: parsed.data } });
  if (!target) fail("not-found");
  if (target.status !== "PENDING") fail("not-pending");

  await db.user.update({
    where: { id: target.id },
    data: { role: "MEMBER", status: "ACTIVE", memberSince: new Date() },
  });
  await notifyUser(target.id, {
    title: "Welcome to The Optimists Club",
    body: "Your application has been approved. We're glad to have you with us.",
    href: "/dashboard",
  });

  done("approved");
}

/** BOARD+: decline (delete) a pending application. */
export async function declineApplication(formData: FormData): Promise<void> {
  await requireRole("BOARD");

  const parsed = idSchema.safeParse(formData.get("userId"));
  if (!parsed.success) fail("not-found");

  const target = await db.user.findUnique({ where: { id: parsed.data } });
  if (!target) fail("not-found");
  if (target.status !== "PENDING") fail("not-pending");

  await db.user.delete({ where: { id: target.id } });

  done("declined");
}

/** ADMIN only: suspend an active member. Never yourself, never another admin. */
export async function suspendMember(formData: FormData): Promise<void> {
  const actor = await requireRole("ADMIN");

  const parsed = idSchema.safeParse(formData.get("userId"));
  if (!parsed.success) fail("not-found");

  const target = await db.user.findUnique({ where: { id: parsed.data } });
  if (!target) fail("not-found");
  if (target.id === actor.id) fail("cannot-suspend-self");
  if (target.role === "ADMIN") fail("cannot-suspend-admin");
  if (target.status !== "ACTIVE") fail("not-active");

  await db.user.update({ where: { id: target.id }, data: { status: "SUSPENDED" } });

  done("suspended");
}

/** ADMIN only: reinstate a suspended member. */
export async function reactivateMember(formData: FormData): Promise<void> {
  await requireRole("ADMIN");

  const parsed = idSchema.safeParse(formData.get("userId"));
  if (!parsed.success) fail("not-found");

  const target = await db.user.findUnique({ where: { id: parsed.data } });
  if (!target) fail("not-found");
  if (target.status !== "SUSPENDED") fail("not-suspended");

  await db.user.update({ where: { id: target.id }, data: { status: "ACTIVE" } });
  await notifyUser(target.id, {
    title: "Your membership has been reinstated",
    body: "Welcome back — your account is active again.",
    href: "/dashboard",
  });

  done("reactivated");
}

const roleChangeSchema = z.object({
  userId: idSchema,
  role: z.enum(["MEMBER", "BOARD"]),
});

/** ADMIN only: move a member between MEMBER and BOARD. Admin roles are untouchable from the UI. */
export async function changeRole(formData: FormData): Promise<void> {
  await requireRole("ADMIN");

  const parsed = roleChangeSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) fail("not-found");

  const target = await db.user.findUnique({ where: { id: parsed.data.userId } });
  if (!target) fail("not-found");
  if (target.role !== "MEMBER" && target.role !== "BOARD") fail("role-locked");
  if (target.status !== "ACTIVE") fail("not-active");
  if (target.role === parsed.data.role) done("role-changed");

  await db.user.update({ where: { id: target.id }, data: { role: parsed.data.role } });
  await notifyUser(target.id, {
    title:
      parsed.data.role === "BOARD"
        ? "You've been appointed to the board"
        : "Your board term has ended",
    body:
      parsed.data.role === "BOARD"
        ? "You now have access to the club's administration area."
        : "Thank you for your service — you remain a full member of the club.",
    href: "/dashboard",
  });

  done("role-changed");
}
