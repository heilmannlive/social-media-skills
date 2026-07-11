import "server-only";
import Stripe from "stripe";

/**
 * Stripe is optional: when STRIPE_SECRET_KEY is unset the app falls back to
 * bank-transfer instructions for membership dues. Always check
 * `isStripeConfigured()` before calling `getStripe()`.
 */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing)");
  if (!stripeClient) stripeClient = new Stripe(key);
  return stripeClient;
}

export function getAppUrl(): string {
  return process.env.APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

/** Annual membership fee. Kept in code for now; move to settings later. */
export const MEMBERSHIP_FEE = { amountCents: 24000, currency: "eur", label: "€240 / year" };
