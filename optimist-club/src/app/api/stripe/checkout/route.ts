import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAppUrl, getStripe, isStripeConfigured, MEMBERSHIP_FEE } from "@/lib/stripe";

/**
 * Starts a Stripe Checkout session for the current year's membership dues.
 * Posted to by the "Pay with card" form on /membership. The payment is
 * recorded as PENDING here and flipped to PAID by the webhook.
 */
export async function POST(): Promise<NextResponse> {
  const appUrl = getAppUrl();

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`, 303);
  }
  if (user.status !== "ACTIVE") {
    return NextResponse.redirect(`${appUrl}/pending`, 303);
  }
  if (!isStripeConfigured()) {
    return NextResponse.redirect(`${appUrl}/membership`, 303);
  }

  const year = new Date().getFullYear();

  const existing = await db.payment.findUnique({
    where: { userId_periodYear: { userId: user.id, periodYear: year } },
  });
  if (existing?.status === "PAID") {
    return NextResponse.redirect(`${appUrl}/membership`, 303);
  }

  await db.payment.upsert({
    where: { userId_periodYear: { userId: user.id, periodYear: year } },
    create: {
      userId: user.id,
      periodYear: year,
      amountCents: MEMBERSHIP_FEE.amountCents,
      currency: MEMBERSHIP_FEE.currency,
      status: "PENDING",
      method: "STRIPE",
    },
    update: {
      status: "PENDING",
      method: "STRIPE",
    },
  });

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: MEMBERSHIP_FEE.currency,
            product_data: {
              name: `The Optimist Club — membership dues ${year}`,
            },
            unit_amount: MEMBERSHIP_FEE.amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/membership?status=success`,
      cancel_url: `${appUrl}/membership?status=cancelled`,
      metadata: { userId: user.id, periodYear: String(year) },
      client_reference_id: user.id,
    });

    await db.payment.update({
      where: { userId_periodYear: { userId: user.id, periodYear: year } },
      data: { stripeSessionId: session.id },
    });

    if (!session.url) {
      return NextResponse.redirect(`${appUrl}/membership?status=error`, 303);
    }
    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    console.error("Stripe checkout session failed", err);
    return NextResponse.redirect(`${appUrl}/membership?status=error`, 303);
  }
}
