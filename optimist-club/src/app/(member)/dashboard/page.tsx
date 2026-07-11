import Link from "next/link";
import { hasRole, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, timeAgo } from "@/lib/format";
import { Badge, ButtonLink, Card, StatusBadge } from "@/components/ui";

export const metadata = { title: "Dashboard — The Optimist Club" };

/** Charter-inspired maxims, rotated by day of year. */
const MAXIMS = [
  "Optimism is not denial — it is the discipline to work for what is possible.",
  "We do not predict better futures. We build them, together.",
  "Every serious ambition begins as an act of stubborn hope.",
  "The pessimist admires the problem. The optimist gets to work.",
  "Trust is our currency; generosity is how we spend it.",
  "Big plans are a courtesy to the people who come after us.",
  "Doubt your doubts before you doubt your plans.",
  "A room full of builders will always out-argue a room full of critics.",
  "Progress is a habit long before it is a headline.",
  "Lift as you climb — the view is better in good company.",
];

function greetingForHour(hour: number): string {
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getFullYear(), 0, 0);
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - start) / 86400000);
}

export default async function DashboardPage() {
  const user = await requireRole("MEMBER");
  const now = new Date();
  const year = now.getFullYear();
  const isBoard = hasRole(user, "BOARD");
  const audienceFilter = isBoard ? {} : { audience: "ALL" };

  const [nextEvent, announcements, duesPayment, activeMembers, upcomingEvents, goingCount] =
    await Promise.all([
      db.event.findFirst({
        where: { isPublished: true, startsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        include: { rsvps: { where: { userId: user.id }, select: { status: true } } },
      }),
      db.announcement.findMany({
        where: audienceFilter,
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: 3,
        include: { author: { select: { name: true } } },
      }),
      db.payment.findUnique({
        where: { userId_periodYear: { userId: user.id, periodYear: year } },
      }),
      db.user.count({ where: { status: "ACTIVE", role: { in: ["MEMBER", "BOARD", "ADMIN"] } } }),
      db.event.count({ where: { isPublished: true, startsAt: { gte: now } } }),
      db.rsvp.count({
        where: { userId: user.id, status: "GOING", event: { isPublished: true, startsAt: { gte: now } } },
      }),
    ]);

  const firstName = user.name.split(/\s+/)[0] ?? user.name;
  const maxim = MAXIMS[dayOfYear(now) % MAXIMS.length];
  const myRsvp = nextEvent?.rsvps[0]?.status ?? null;
  const duesPaid = duesPayment?.status === "PAID";
  // FAILED (e.g. abandoned card checkout) renders like unpaid: payable again.
  const duesPending = duesPayment?.status === "PENDING";
  const duesPendingTransfer = duesPending && duesPayment?.method === "TRANSFER";

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-navy-950">
          {greetingForHour(now.getHours())}, {firstName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm italic text-navy-500">&ldquo;{maxim}&rdquo;</p>
      </div>

      {/* Club pulse */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">
            Active members
          </p>
          <p className="mt-1 font-display text-3xl text-navy-950">{activeMembers}</p>
        </Card>
        <Card className="py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">
            Upcoming events
          </p>
          <p className="mt-1 font-display text-3xl text-navy-950">{upcomingEvents}</p>
        </Card>
        <Card className="py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">
            Events you&rsquo;re attending
          </p>
          <p className="mt-1 font-display text-3xl text-navy-950">{goingCount}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Next event */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 font-display text-xl text-navy-900">Your next event</h2>
          {nextEvent ? (
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    href={`/events/${nextEvent.id}`}
                    className="font-display text-lg text-navy-950 underline-offset-2 hover:underline"
                  >
                    {nextEvent.title}
                  </Link>
                  <p className="mt-1 text-sm text-navy-600">
                    {formatDateTime(nextEvent.startsAt)}
                    {nextEvent.city ? <span> · {nextEvent.city}</span> : null}
                  </p>
                  <p className="mt-3 text-sm text-navy-500">
                    {myRsvp === "GOING"
                      ? "You're confirmed. We look forward to seeing you there."
                      : myRsvp === "WAITLIST"
                        ? "You're on the waitlist — we'll notify you the moment a seat opens."
                        : myRsvp === "DECLINED"
                          ? "You've declined this one. Changed your mind? You can update your RSVP."
                          : "You haven't responded yet. Let us know if you'll join."}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  {myRsvp ? <StatusBadge value={myRsvp} /> : <Badge tone="gray">No RSVP</Badge>}
                  <ButtonLink href={`/events/${nextEvent.id}`} variant="outline">
                    View event
                  </ButtonLink>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col items-center gap-2 py-10 text-center">
              <p className="font-display text-lg text-navy-800">Nothing on the calendar — yet</p>
              <p className="max-w-md text-sm text-navy-500">
                The next gathering will appear here the moment it&rsquo;s published.
              </p>
              <ButtonLink href="/events" variant="outline" className="mt-2">
                Browse events
              </ButtonLink>
            </Card>
          )}
        </div>

        {/* Dues status */}
        <div>
          <h2 className="mb-3 font-display text-xl text-navy-900">Membership {year}</h2>
          {duesPaid ? (
            <Card className="border-emerald-200">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-navy-900">Dues for {year}</p>
                <Badge tone="green">Paid</Badge>
              </div>
              <p className="mt-2 text-sm text-navy-600">
                Your membership is in good standing. Thank you for carrying the club forward.
              </p>
            </Card>
          ) : duesPending ? (
            <Card className="border-amber-200">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-navy-900">Dues for {year}</p>
                <Badge tone="gold">Pending</Badge>
              </div>
              {duesPendingTransfer ? (
                <p className="mt-2 text-sm text-navy-600">
                  We are confirming your transfer — no action needed. We&rsquo;ll notify you as
                  soon as it clears.
                </p>
              ) : (
                <>
                  <p className="mt-2 text-sm text-navy-600">
                    A card payment is in progress. If you didn&rsquo;t complete checkout, you
                    can pick it back up on the membership page.
                  </p>
                  <ButtonLink href="/membership" variant="outline" className="mt-4 w-full">
                    Go to membership
                  </ButtonLink>
                </>
              )}
            </Card>
          ) : (
            <Card className="border-navy-200">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-navy-900">Dues for {year}</p>
                <Badge tone="gray">Open</Badge>
              </div>
              <p className="mt-2 text-sm text-navy-600">
                Your {year} membership dues are still open. Settle them in a minute on the
                membership page.
              </p>
              <ButtonLink href="/membership" variant="gold" className="mt-4 w-full">
                Pay membership dues
              </ButtonLink>
            </Card>
          )}
        </div>
      </div>

      {/* Latest announcements */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl text-navy-900">Latest announcements</h2>
          <Link
            href="/announcements"
            className="text-sm font-medium text-navy-600 underline-offset-2 hover:underline"
          >
            View all
          </Link>
        </div>
        {announcements.length === 0 ? (
          <Card className="py-8 text-center">
            <p className="text-sm text-navy-500">
              No announcements yet. When the club has news, you&rsquo;ll read it here first.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <Card key={a.id} className="py-4">
                <Link href="/announcements" className="group block">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-navy-900 underline-offset-2 group-hover:underline">
                      {a.title}
                    </p>
                    {a.pinned ? <Badge tone="gold">Pinned</Badge> : null}
                    {a.audience === "BOARD" ? <Badge tone="navy">Board</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs text-navy-400">
                    {a.author.name} · {timeAgo(a.createdAt)}
                  </p>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
