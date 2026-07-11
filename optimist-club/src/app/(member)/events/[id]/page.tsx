import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { Avatar, Badge, Button, Card } from "@/components/ui";
import { attendEvent, declineEvent } from "../actions";

export const metadata = { title: "Event — The Optimists Club" };

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("MEMBER");
  const { id } = await params;

  const event = await db.event.findUnique({
    where: { id },
    include: {
      rsvps: {
        include: {
          user: {
            select: { id: true, name: true, title: true, organization: true, status: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!event || !event.isPublished) notFound();

  const isPast = event.startsAt < new Date();
  const going = event.rsvps.filter((r) => r.status === "GOING");
  const waitlist = event.rsvps.filter((r) => r.status === "WAITLIST");
  const mine = event.rsvps.find((r) => r.userId === user.id);
  const waitlistPosition =
    mine?.status === "WAITLIST"
      ? waitlist.findIndex((r) => r.userId === user.id) + 1
      : null;

  const isFull = event.capacity !== null && going.length >= event.capacity;
  const capacityPct =
    event.capacity !== null
      ? Math.min(100, Math.round((going.length / event.capacity) * 100))
      : null;

  const place = [event.location, event.city].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/events" className="text-sm font-medium text-navy-500 hover:text-navy-800">
          ← All events
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl text-navy-950">{event.title}</h1>
          {isPast ? <Badge tone="gray">Past event</Badge> : null}
        </div>
        <p className="mt-2 text-sm font-medium text-navy-700">{formatDateTime(event.startsAt)}
          {event.endsAt ? ` — ${formatDateTime(event.endsAt)}` : ""}
        </p>
        <p className="mt-1 text-sm text-navy-500">{place}</p>
      </div>

      {/* RSVP status + controls */}
      {isPast ? (
        <Card>
          <p className="text-sm text-navy-600">
            {mine?.status === "GOING"
              ? "You attended this event."
              : mine?.status === "WAITLIST"
                ? "You were on the waitlist for this event."
                : mine?.status === "DECLINED"
                  ? "You couldn't make this one."
                  : "This event has already taken place."}
          </p>
        </Card>
      ) : (
        <Card>
          {mine?.status === "GOING" ? (
            <p className="text-sm font-medium text-accent-800">
              You&rsquo;re confirmed for this event. We look forward to seeing you.
            </p>
          ) : mine?.status === "WAITLIST" ? (
            <p className="text-sm font-medium text-accent-800">
              You&rsquo;re on the waitlist — position {waitlistPosition}. The moment a spot
              opens, you&rsquo;re in, and we&rsquo;ll notify you right away.
            </p>
          ) : mine?.status === "DECLINED" ? (
            <p className="text-sm text-navy-600">
              You&rsquo;ve let us know you can&rsquo;t make it. Plans changed? You can still
              join below.
            </p>
          ) : (
            <p className="text-sm text-navy-600">
              Will you be joining us? Let the club know either way.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            {/* Already-waitlisted members keep their position; no re-join
                button while the event is still full. */}
            {mine?.status !== "GOING" && !(mine?.status === "WAITLIST" && isFull) ? (
              <form action={attendEvent}>
                <input type="hidden" name="eventId" value={event.id} />
                <Button type="submit" variant="accent">
                  {isFull ? "Join the waitlist" : "Attend"}
                </Button>
              </form>
            ) : null}
            {mine?.status !== "DECLINED" ? (
              <form action={declineEvent}>
                <input type="hidden" name="eventId" value={event.id} />
                <Button type="submit" variant="outline">
                  Cannot make it
                </Button>
              </form>
            ) : null}
          </div>
          {isFull && mine?.status !== "GOING" && mine?.status !== "WAITLIST" ? (
            <p className="mt-3 text-xs text-navy-400">
              This event is at capacity. Joining the waitlist puts you next in line — spots
              open up more often than you&rsquo;d think.
            </p>
          ) : null}
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-display text-lg text-navy-900">About this event</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-navy-700">
          {event.description}
        </p>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg text-navy-900">
            {isPast ? "Who attended" : "Who's coming"}
          </h2>
          <span className="text-sm text-navy-500">
            {going.length} confirmed
            {event.capacity !== null ? ` of ${event.capacity} seats` : ""}
            {waitlist.length > 0 ? ` · ${waitlist.length} waitlisted` : ""}
          </span>
        </div>

        {capacityPct !== null ? (
          <div
            className="mb-4 h-2 w-full overflow-hidden rounded-full bg-navy-100"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={event.capacity ?? 0}
            aria-valuenow={going.length}
            aria-label="Confirmed attendance"
          >
            <div
              className={`h-full rounded-full ${capacityPct >= 100 ? "bg-accent-500" : "bg-navy-800"}`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>
        ) : null}

        {going.length === 0 ? (
          <p className="text-sm text-navy-500">
            {isPast
              ? "No confirmed attendees were recorded for this event."
              : "No one has confirmed yet — be the first name on the list."}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {going.map((r) => {
              const person = (
                <>
                  <Avatar name={r.user.name} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-navy-900">
                      {r.user.name}
                    </span>
                    {r.user.title ? (
                      <span className="block truncate text-xs text-navy-500">
                        {r.user.title}
                        {r.user.organization ? `, ${r.user.organization}` : ""}
                      </span>
                    ) : null}
                  </span>
                </>
              );
              // Profile pages only exist for ACTIVE members; render others
              // (e.g. since-suspended attendees) without a dead link.
              return (
                <li key={r.id}>
                  {r.user.status === "ACTIVE" ? (
                    <Link
                      href={`/members/${r.user.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 -m-2 hover:bg-navy-50"
                    >
                      {person}
                    </Link>
                  ) : (
                    <span className="flex items-center gap-3 p-2 -m-2">{person}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
