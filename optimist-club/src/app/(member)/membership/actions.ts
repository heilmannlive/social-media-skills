"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { notifyMembers } from "@/lib/notifications";
import { MEMBERSHIP_FEE } from "@/lib/stripe";

/**
 * Member reports that they have sent the bank transfer for the current year.
 * Records a PENDING TRANSFER payment (never downgrading an existing PAID one)
 * and lets the administrators know there is something to confirm.
 */
export async function reportTransfer(_formData: FormData): Promise<void> {
  const user = await requireRole("MEMBER");

  const year = new Date().getFullYear();
  const reference = `OC-${year}-${user.id.slice(0, 8).toUpperCase()}`;

  const existing = await db.payment.findUnique({
    where: { userId_periodYear: { userId: user.id, periodYear: year } },
  });
  if (existing?.status === "PAID") {
    redirect("/membership?notice=already-paid");
  }

  await db.payment.upsert({
    where: { userId_periodYear: { userId: user.id, periodYear: year } },
    create: {
      userId: user.id,
      periodYear: year,
      amountCents: MEMBERSHIP_FEE.amountCents,
      currency: MEMBERSHIP_FEE.currency,
      status: "PENDING",
      method: "TRANSFER",
      note: reference,
    },
    update: {
      status: "PENDING",
      method: "TRANSFER",
      note: reference,
    },
  });

  await notifyMembers(
    {
      title: `${user.name} reported a bank transfer`,
      body: `Membership dues ${year}, reference ${reference}. Please confirm once the funds arrive.`,
      href: "/admin/payments",
    },
    { minRole: "ADMIN", excludeUserId: user.id }
  );

  revalidatePath("/membership");
  revalidatePath("/admin/payments");
  redirect("/membership?notice=transfer-reported");
}
