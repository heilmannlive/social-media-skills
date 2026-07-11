import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { getStripe, isStripeConfigured, MEMBERSHIP_FEE } from "@/lib/stripe";

/**
 * Stripe webhook endpoint. Verifies the event signature, then marks the
 * matching membership payment as PAID on `checkout.session.completed`.
 * Called by Stripe directly — no session cookie involved.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !isStripeConfigured()) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const periodYear = Number(session.metadata?.periodYear);

    if (userId && Number.isInteger(periodYear)) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (user) {
        // Idempotency: Stripe redelivers events. If the payment is already
        // PAID, keep the original paidAt and do not notify again.
        const existing = await db.payment.findUnique({
          where: { userId_periodYear: { userId, periodYear } },
        });
        if (existing?.status === "PAID") {
          return NextResponse.json({ received: true });
        }

        await db.payment.upsert({
          where: { userId_periodYear: { userId, periodYear } },
          create: {
            userId,
            periodYear,
            amountCents: session.amount_total ?? MEMBERSHIP_FEE.amountCents,
            currency: session.currency ?? MEMBERSHIP_FEE.currency,
            status: "PAID",
            method: "STRIPE",
            stripeSessionId: session.id,
            paidAt: new Date(),
          },
          update: {
            status: "PAID",
            method: "STRIPE",
            stripeSessionId: session.id,
            paidAt: new Date(),
          },
        });

        await notifyUser(userId, {
          title: "Membership dues received — thank you",
          body: `Your ${periodYear} membership dues are settled. We appreciate you.`,
          href: "/membership",
        });

        revalidatePath("/membership");
        revalidatePath("/admin/payments");
      } else {
        console.error(`Stripe webhook: unknown user ${userId} on session ${session.id}`);
      }
    } else {
      console.error(`Stripe webhook: missing metadata on session ${session.id}`);
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const periodYear = Number(session.metadata?.periodYear);

    // The member abandoned checkout. Mark the still-pending Stripe payment
    // FAILED so it becomes payable again — never touch a PAID row.
    const match =
      userId && Number.isInteger(periodYear)
        ? { userId, periodYear }
        : { stripeSessionId: session.id };
    const { count } = await db.payment.updateMany({
      where: { ...match, status: "PENDING", method: "STRIPE" },
      data: { status: "FAILED" },
    });
    if (count > 0) {
      revalidatePath("/membership");
      revalidatePath("/admin/payments");
    }
  }

  return NextResponse.json({ received: true });
}
