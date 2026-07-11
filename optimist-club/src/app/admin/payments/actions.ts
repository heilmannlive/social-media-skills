"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";
import { MEMBERSHIP_FEE } from "@/lib/stripe";

const inputSchema = z.object({
  userId: z.string().min(1).max(64),
  year: z.coerce.number().int().min(2000).max(2100),
});

function refreshPaymentViews(): void {
  revalidatePath("/admin/payments");
  revalidatePath("/membership");
}

function done(year: number, notice: string): never {
  refreshPaymentViews();
  redirect(`/admin/payments?year=${year}&notice=${notice}`);
}

function fail(year: number, error: string): never {
  redirect(`/admin/payments?year=${year}&error=${error}`);
}

function parseInput(formData: FormData): { userId: string; year: number } {
  const parsed = inputSchema.safeParse({
    userId: formData.get("userId"),
    year: formData.get("year"),
  });
  if (!parsed.success) fail(new Date().getFullYear(), "invalid");
  return parsed.data;
}

/** ADMIN only: record dues as paid for a member and year (e.g. cash, waiver). */
export async function markPaid(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const { userId, year } = parseInput(formData);

  const member = await db.user.findUnique({ where: { id: userId } });
  if (!member) fail(year, "not-found");

  const existing = await db.payment.findUnique({
    where: { userId_periodYear: { userId, periodYear: year } },
  });
  if (existing?.status === "PAID") fail(year, "already-paid");

  await db.payment.upsert({
    where: { userId_periodYear: { userId, periodYear: year } },
    create: {
      userId,
      periodYear: year,
      amountCents: MEMBERSHIP_FEE.amountCents,
      currency: MEMBERSHIP_FEE.currency,
      status: "PAID",
      method: "MANUAL",
      paidAt: new Date(),
    },
    update: {
      status: "PAID",
      method: "MANUAL",
      paidAt: new Date(),
    },
  });

  await notifyUser(userId, {
    title: "Membership dues received — thank you",
    body: `Your ${year} membership dues have been recorded as paid.`,
    href: "/membership",
  });

  done(year, "marked-paid");
}

/** ADMIN only: confirm a reported bank transfer once the funds have arrived. */
export async function confirmTransfer(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const { userId, year } = parseInput(formData);

  const payment = await db.payment.findUnique({
    where: { userId_periodYear: { userId, periodYear: year } },
  });
  if (!payment) fail(year, "not-found");
  if (payment.status !== "PENDING" || payment.method !== "TRANSFER") {
    fail(year, "not-pending-transfer");
  }

  await db.payment.update({
    where: { id: payment.id },
    data: { status: "PAID", paidAt: new Date() },
  });

  await notifyUser(userId, {
    title: "Membership dues received — thank you",
    body: `Your bank transfer for the ${year} membership dues has been confirmed.`,
    href: "/membership",
  });

  done(year, "transfer-confirmed");
}

/**
 * ADMIN only: remove a payment record so the member can start over.
 * Deleting a PAID record is destructive and requires the explicit
 * confirm checkbox (`confirm=1`).
 */
export async function resetPayment(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const { userId, year } = parseInput(formData);

  const payment = await db.payment.findUnique({
    where: { userId_periodYear: { userId, periodYear: year } },
  });
  if (!payment) fail(year, "not-found");

  if (payment.status === "PAID" && formData.get("confirm") !== "1") {
    fail(year, "confirm-required");
  }

  await db.payment.delete({ where: { id: payment.id } });

  done(year, "reset");
}
