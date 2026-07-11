import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Events — The Optimists Club" };

type RsvpSlice = { userId: string; status: string };

function myRsvpBadge(rsvps: RsvpSlice[], userId: string) {
  const mine = rsvps.find((r) => r.userId === userId);
  if (!mine) return <Badge tone="gray">No response yet</Badge>;
  if (mine.status === "GOING") return <Badge tone="green">You&rsquo;re going</Badge>;
  if (mine.status === "WAITLIST") return <Badge tone="accent">Waitlisted</Badge>;
  return <Badge tone="red">Not attending</Badge>;
}

function goingCount(rsvps: RsvpSlice[]): number {
  return rsvps.filter((r) => r.status === "GOING").length;
}

function DateBlock({ date }: { date: Date }) {
  return (
    <div
      className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-navy-900 text-white"
      aria-hidden="true"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider text-accent-300">
        {date.toLocaleDateString("en-US", { month: "short" })}
      </span>
      <span className="font-display text-2xl leading-none">
        {date.toLocaleDateString("en-US", { day: "numeric" })}
      </span>
    </div>
  );
}

export default async function EventsPage() {
  const user = await requireRole("MEMBER");
  const now = new Date();

  const [upcoming, past] = await Promise.all([
    db.event.findMany({
      where: { isPublished: true, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      include: { rsvps: { select: { userId: true, status: true } } },
    }),
    db.event.findMany({
      where: { isPublished: true, startsAt: { lt: now } },
      orderBy: { startsAt: "desc" },
      take: 10,
      include: { rsvps: { select: { userId: true, status: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Events"
        subtitle="Dinners, salons, and gatherings — where the club actually happens."
      />

      {upcoming.length === 0 ? (
        <EmptyState
          title="Nothing on the calendar yet"
          description="The next gathering is being planned. You'll see it here — and get a notification — the moment it's announced."
        />
      ) : (
        <div className="space-y-4">
          {upcoming.map((event) => {
            const going = goingCount(event.rsvps);
            const place = [event.location, event.city].filter(Boolean).join(", ");
            return (
              <Link key={event.id} href={`/events/${event.id}`} className="group block">
                <Card className="transition-colors group-hover:border-navy-300">
                  <div className="flex items-start gap-4">
                    <DateBlock date={event.startsAt} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-xl text-navy-950">{event.title}</h2>
                        {myRsvpBadge(event.rsvps, user.id)}
                      </div>
                      <p className="mt-1 text-sm text-navy-600">{formatDateTime(event.startsAt)}</p>
                      <p className="mt-0.5 truncate text-sm text-navy-500">{place}</p>
                      <p className="mt-2 text-xs font-medium text-navy-400">
                        {going} confirmed
                        {event.capacity !== null ? ` · ${event.capacity} seats` : ""}
                        {event.capacity !== null && going >= event.capacity
                          ? " · waitlist open"
                          : ""}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <section className="mt-12">
        <h2 className="mb-4 font-display text-xl text-navy-900">Past events</h2>
        {past.length === 0 ? (
          <p className="text-sm text-navy-500">
            No past events yet — the club&rsquo;s history starts with the first gathering.
          </p>
        ) : (
          <Card className="divide-y divide-navy-100 p-0">
            {past.map((event) => {
              const going = goingCount(event.rsvps);
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-3.5 hover:bg-navy-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy-900">{event.title}</p>
                    <p className="text-xs text-navy-500">
                      {formatDate(event.startsAt)}
                      {event.city ? ` · ${event.city}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-navy-400">{going} attended</span>
                </Link>
              );
            })}
          </Card>
        )}
      </section>
    </div>
  );
}
