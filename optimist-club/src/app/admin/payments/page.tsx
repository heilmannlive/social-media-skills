import Link from "next/link";
import { hasRole, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { MEMBERSHIP_FEE } from "@/lib/stripe";
import { Avatar, Badge, Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { confirmTransfer, markPaid, resetPayment } from "./actions";

export const metadata = { title: "Payments — The Optimists Club" };

const NOTICES: Record<string, string> = {
  "marked-paid": "Dues recorded as paid. The member has been notified.",
  "transfer-confirmed": "Transfer confirmed. The member has been notified.",
  reset: "Payment record removed.",
};

const ERRORS: Record<string, string> = {
  invalid: "That request could not be processed.",
  "not-found": "That payment record no longer exists.",
  "already-paid": "Those dues are already recorded as paid.",
  "not-pending-transfer": "Only pending bank transfers can be confirmed here.",
  "confirm-required":
    "Removing a paid record is destructive — tick the confirm box next to Reset first.",
};

const METHOD_LABELS: Record<string, string> = {
  STRIPE: "Card (Stripe)",
  TRANSFER: "Bank transfer",
  MANUAL: "Manual",
};

function SummaryChip({ label, value, tone }: { label: string; value: string; tone: "green" | "accent" | "gray" | "navy" }) {
  return (
    <Card className="flex items-center gap-3 px-4 py-3">
      <Badge tone={tone}>{label}</Badge>
      <span className="font-display text-xl text-navy-950">{value}</span>
    </Card>
  );
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; notice?: string; error?: string }>;
}) {
  const actor = await requireRole("BOARD");
  const actorIsAdmin = hasRole(actor, "ADMIN");
  const params = await searchParams;

  const currentYear = new Date().getFullYear();
  const parsedYear = Number(params.year);
  const year =
    Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100
      ? parsedYear
      : currentYear;

  const [members, paymentYears] = await Promise.all([
    db.user.findMany({
      where: { status: "ACTIVE", role: { in: ["MEMBER", "BOARD", "ADMIN"] } },
      orderBy: { name: "asc" },
      include: { payments: { where: { periodYear: year } } },
    }),
    db.payment.findMany({
      select: { periodYear: true },
      distinct: ["periodYear"],
      orderBy: { periodYear: "desc" },
    }),
  ]);

  const years = Array.from(
    new Set([currentYear, year, ...paymentYears.map((p) => p.periodYear)])
  ).sort((a, b) => b - a);

  const rows = members.map((m) => ({ member: m, payment: m.payments[0] ?? null }));
  const paid = rows.filter((r) => r.payment?.status === "PAID");
  const pending = rows.filter((r) => r.payment?.status === "PENDING");
  const unpaid = rows.filter((r) => !r.payment || r.payment.status === "FAILED");
  const collectedCents = paid.reduce((sum, r) => sum + (r.payment?.amountCents ?? 0), 0);

  const notice = params.notice ? NOTICES[params.notice] : undefined;
  const error = params.error ? ERRORS[params.error] : undefined;

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle={`Membership dues of ${formatMoney(MEMBERSHIP_FEE.amountCents, MEMBERSHIP_FEE.currency)} per member and year.`}
      />

      {notice ? (
        <div
          role="status"
          className="mb-6 rounded-md border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800"
        >
          {notice}
        </div>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        {years.map((y) => (
          <Link
            key={y}
            href={`/admin/payments?year=${y}`}
            className={
              y === year
                ? "rounded-md bg-navy-900 px-3 py-1.5 text-sm font-semibold text-white"
                : "rounded-md px-3 py-1.5 text-sm font-medium text-navy-600 hover:bg-navy-100 hover:text-navy-950"
            }
          >
            {y}
          </Link>
        ))}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryChip label="Paid" value={String(paid.length)} tone="green" />
        <SummaryChip label="Pending" value={String(pending.length)} tone="accent" />
        <SummaryChip label="Unpaid" value={String(unpaid.length)} tone="gray" />
        <SummaryChip
          label="Collected"
          value={formatMoney(collectedCents, MEMBERSHIP_FEE.currency)}
          tone="navy"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No active members yet"
          description="Once members are active, their dues for each year are tracked here."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wider text-navy-400">
                <th className="px-4 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Method</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Paid on</th>
                <th className="px-4 py-3 font-semibold">Note</th>
                {actorIsAdmin ? (
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ member, payment }) => (
                <tr key={member.id} className="border-b border-navy-50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium text-navy-950">{member.name}</p>
                        <p className="truncate text-xs text-navy-400">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-navy-700">
                    {payment ? formatMoney(payment.amountCents, payment.currency) : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-navy-700">
                    {payment ? (METHOD_LABELS[payment.method] ?? payment.method) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {payment ? (
                      payment.status === "PENDING" ? (
                        <Badge tone="accent">PENDING</Badge>
                      ) : (
                        <StatusBadge value={payment.status} />
                      )
                    ) : (
                      <Badge tone="gray">UNPAID</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-navy-600">
                    {payment?.paidAt ? formatDate(payment.paidAt) : "—"}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-xs text-navy-500" title={payment?.note ?? undefined}>
                    {payment?.note ?? "—"}
                  </td>
                  {actorIsAdmin ? (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {payment?.status === "PENDING" && payment.method === "TRANSFER" ? (
                          <form action={confirmTransfer}>
                            <input type="hidden" name="userId" value={member.id} />
                            <input type="hidden" name="year" value={year} />
                            <Button type="submit" variant="accent" className="px-3 py-1.5 text-xs">
                              Confirm transfer
                            </Button>
                          </form>
                        ) : null}
                        {payment?.status !== "PAID" ? (
                          <form action={markPaid}>
                            <input type="hidden" name="userId" value={member.id} />
                            <input type="hidden" name="year" value={year} />
                            <Button type="submit" variant="outline" className="px-3 py-1.5 text-xs">
                              Mark paid
                            </Button>
                          </form>
                        ) : null}
                        {payment ? (
                          <form action={resetPayment} className="flex items-center gap-2">
                            <input type="hidden" name="userId" value={member.id} />
                            <input type="hidden" name="year" value={year} />
                            {payment.status === "PAID" ? (
                              <label className="flex items-center gap-1 text-xs text-navy-500">
                                <input
                                  type="checkbox"
                                  name="confirm"
                                  value="1"
                                  className="h-3.5 w-3.5 rounded border-navy-300"
                                />
                                confirm
                              </label>
                            ) : null}
                            <Button type="submit" variant="ghost" className="px-3 py-1.5 text-xs">
                              Reset
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {!actorIsAdmin ? (
        <p className="mt-4 text-xs text-navy-400">
          As a board member you can review the dues ledger. Recording, confirming, and
          resetting payments requires an administrator.
        </p>
      ) : null}
    </div>
  );
}
