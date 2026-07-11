import type { Payment } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { isStripeConfigured, MEMBERSHIP_FEE } from "@/lib/stripe";
import { Badge, Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { reportTransfer } from "./actions";

export const metadata = { title: "Membership — The Optimists Club" };

const METHOD_LABELS: Record<string, string> = {
  STRIPE: "Card (Stripe)",
  TRANSFER: "Bank transfer",
  MANUAL: "Recorded by the board",
};

function methodLabel(method: string): string {
  return METHOD_LABELS[method] ?? method;
}

function Banner({ kind, children }: { kind: "success" | "info" | "error"; children: React.ReactNode }) {
  const styles =
    kind === "success"
      ? "border-accent-200 bg-accent-50 text-accent-800"
      : kind === "error"
        ? "border-red-200 bg-red-50 text-red-800"
        : "border-navy-200 bg-navy-50 text-navy-800";
  return (
    <div role="status" className={`mb-6 rounded-md border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

export default async function MembershipPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; notice?: string }>;
}) {
  const user = await requireRole("MEMBER");
  const params = await searchParams;

  const currentYear = new Date().getFullYear();
  const reference = `OC-${currentYear}-${user.id.slice(0, 8).toUpperCase()}`;

  const payments = await db.payment.findMany({
    where: { userId: user.id },
    orderBy: { periodYear: "desc" },
  });
  const current: Payment | undefined = payments.find((p) => p.periodYear === currentYear);

  const isPaid = current?.status === "PAID";
  const isPending = current?.status === "PENDING";
  const stripeReady = isStripeConfigured();

  return (
    <div>
      <PageHeader
        title="Membership"
        subtitle="Your annual dues keep the club independent, ambitious, and entirely ours."
      />

      {params.status === "success" ? (
        <Banner kind="success">
          Thank you — your card payment went through. It will be confirmed here within a
          minute, as soon as our payment provider notifies us.
        </Banner>
      ) : null}
      {params.status === "cancelled" ? (
        <Banner kind="info">
          No harm done — the card payment was cancelled and nothing was charged. Whenever
          you are ready, both payment options below remain open.
        </Banner>
      ) : null}
      {params.status === "error" ? (
        <Banner kind="error">
          We could not start the card payment just now. Please try again in a moment, or
          use the bank transfer instructions below.
        </Banner>
      ) : null}
      {params.notice === "transfer-reported" ? (
        <Banner kind="success">
          Thank you — we have noted your transfer. The board will confirm it as soon as the
          funds arrive, usually within a few business days.
        </Banner>
      ) : null}
      {params.notice === "already-paid" ? (
        <Banner kind="info">Your dues for {currentYear} are already settled — nothing more to do.</Banner>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current year status */}
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">
                Dues for {currentYear}
              </p>
              <p className="mt-1 font-display text-3xl text-navy-950">
                {formatMoney(MEMBERSHIP_FEE.amountCents, MEMBERSHIP_FEE.currency)}
                <span className="ml-2 text-base text-navy-400">per year</span>
              </p>
            </div>
            {isPaid ? (
              <StatusBadge value="PAID" />
            ) : isPending ? (
              <Badge tone="accent">PENDING</Badge>
            ) : (
              <Badge tone="gray">UNPAID</Badge>
            )}
          </div>

          {isPaid ? (
            <p className="mt-4 text-sm text-navy-600">
              Settled{current?.paidAt ? ` on ${formatDate(current.paidAt)}` : ""} via{" "}
              {methodLabel(current!.method).toLowerCase()}. Thank you for carrying the club
              forward this year.
            </p>
          ) : isPending ? (
            <p className="mt-4 text-sm text-navy-600">
              {current?.method === "TRANSFER"
                ? "You reported a bank transfer — the board will confirm it as soon as the funds arrive."
                : "A card payment is in progress. This page will reflect it within a minute of completion."}
            </p>
          ) : (
            <p className="mt-4 text-sm text-navy-600">
              Your dues for {currentYear} are still open. Settle them by card in under a
              minute, or by bank transfer if you prefer.
            </p>
          )}

          {!isPaid && stripeReady ? (
            <form method="POST" action="/api/stripe/checkout" className="mt-5">
              <Button type="submit" variant="accent">
                Pay {formatMoney(MEMBERSHIP_FEE.amountCents, MEMBERSHIP_FEE.currency)} with card
              </Button>
            </form>
          ) : null}
        </Card>

        {/* Bank transfer instructions */}
        <Card>
          <h2 className="font-display text-lg text-navy-950">Pay by bank transfer</h2>
          <p className="mt-1 text-sm text-navy-500">
            Prefer the classic route? Wire the dues to the club account and include your
            personal reference so we can match the payment.
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-navy-500">Account holder</dt>
              <dd className="font-medium text-navy-900">The Optimists Club</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-navy-500">IBAN</dt>
              <dd className="font-mono font-medium text-navy-900">DE00 0000 0000 0000 0000 00</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-navy-500">BIC</dt>
              <dd className="font-mono font-medium text-navy-900">OPTIMDEXXX</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-navy-500">Amount</dt>
              <dd className="font-medium text-navy-900">
                {formatMoney(MEMBERSHIP_FEE.amountCents, MEMBERSHIP_FEE.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-navy-500">Reference</dt>
              <dd className="font-mono font-medium text-navy-900">{reference}</dd>
            </div>
          </dl>
          {!isPaid ? (
            <form action={reportTransfer} className="mt-5">
              <Button type="submit" variant="outline">
                I have sent the transfer
              </Button>
            </form>
          ) : (
            <p className="mt-5 text-sm text-navy-500">
              Your dues for {currentYear} are settled — no transfer needed.
            </p>
          )}
        </Card>
      </div>

      {/* Payment history */}
      <h2 className="mt-10 mb-4 font-display text-xl text-navy-950">Payment history</h2>
      {payments.length === 0 ? (
        <EmptyState
          title="No payments on record yet"
          description={`Once you settle your ${currentYear} dues, every payment will be listed here for your records.`}
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wider text-navy-400">
                <th className="px-4 py-3 font-semibold">Year</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Method</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Paid on</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-navy-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-navy-950">{p.periodYear}</td>
                  <td className="px-4 py-3 text-navy-700">
                    {formatMoney(p.amountCents, p.currency)}
                  </td>
                  <td className="px-4 py-3 text-navy-700">{methodLabel(p.method)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={p.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-navy-600">
                    {p.paidAt ? formatDate(p.paidAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
