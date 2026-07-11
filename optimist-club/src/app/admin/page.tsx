import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";

export const metadata = { title: "Administration — The Optimists Club" };

export default async function AdminOverviewPage() {
  await requireRole("BOARD");

  const now = new Date();
  const year = now.getFullYear();

  const [activeMembers, pendingApplications, upcomingEvents, duesPaid] = await Promise.all([
    db.user.count({
      where: { status: "ACTIVE", role: { in: ["MEMBER", "BOARD", "ADMIN"] } },
    }),
    db.user.count({ where: { status: "PENDING" } }),
    db.event.count({ where: { isPublished: true, startsAt: { gte: now } } }),
    db.payment.count({ where: { status: "PAID", periodYear: year } }),
  ]);

  const stats = [
    {
      label: "Active members",
      value: activeMembers,
      href: "/admin/members?status=ACTIVE",
      hint: "Full members in good standing",
    },
    {
      label: "Pending applications",
      value: pendingApplications,
      href: "/admin/members?status=PENDING",
      hint: pendingApplications > 0 ? "Awaiting your review" : "All caught up",
    },
    {
      label: "Upcoming events",
      value: upcomingEvents,
      href: "/admin/events",
      hint: "Published and on the calendar",
    },
    {
      label: `Dues paid in ${year}`,
      value: duesPaid,
      href: "/admin/payments",
      hint: "Members who have settled this year",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Administration"
        subtitle="The state of the club at a glance."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group">
            <Card className="h-full transition-colors group-hover:border-navy-300">
              <p className="text-sm font-medium text-navy-500">{s.label}</p>
              <p className="mt-2 font-display text-4xl text-navy-950">{s.value}</p>
              <p className="mt-2 text-xs text-navy-400">{s.hint}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="font-display text-lg text-navy-950">Membership</h2>
          <p className="mt-1 text-sm text-navy-500">
            Review applications, manage roles, and issue invitations.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-navy-800">
            <Link href="/admin/members" className="hover:text-navy-950 hover:underline">
              Members &amp; applications →
            </Link>
            <Link href="/admin/invites" className="hover:text-navy-950 hover:underline">
              Invitations →
            </Link>
          </div>
        </Card>
        <Card>
          <h2 className="font-display text-lg text-navy-950">Programming &amp; finances</h2>
          <p className="mt-1 text-sm text-navy-500">
            Plan events, publish announcements, and keep dues in order.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-navy-800">
            <Link href="/admin/events" className="hover:text-navy-950 hover:underline">
              Events →
            </Link>
            <Link href="/admin/announcements" className="hover:text-navy-950 hover:underline">
              Announcements →
            </Link>
            <Link href="/admin/payments" className="hover:text-navy-950 hover:underline">
              Payments →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
