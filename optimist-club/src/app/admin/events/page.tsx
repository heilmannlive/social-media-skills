import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Events — Admin — The Optimist Club" };

export default async function AdminEventsPage() {
  await requireRole("BOARD");

  const events = await db.event.findMany({
    orderBy: { startsAt: "desc" },
    include: { rsvps: { select: { status: true } } },
  });

  const now = new Date();

  return (
    <div>
      <PageHeader
        title="Events"
        subtitle="Every event — drafts, published, upcoming, and past."
        actions={<ButtonLink href="/admin/events/new">New event</ButtonLink>}
      />

      {events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Create the club's first event. Save it as a draft until the details are set, then publish to notify every member."
          action={<ButtonLink href="/admin/events/new">Create an event</ButtonLink>}
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wider text-navy-400">
                <th className="px-6 py-3 font-semibold">Event</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Going</th>
                <th className="px-4 py-3 font-semibold">Waitlist</th>
                <th className="px-6 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {events.map((event) => {
                const going = event.rsvps.filter((r) => r.status === "GOING").length;
                const waitlist = event.rsvps.filter((r) => r.status === "WAITLIST").length;
                const isPast = event.startsAt < now;
                return (
                  <tr key={event.id} className="hover:bg-navy-50/60">
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-navy-900">{event.title}</p>
                      {isPast ? <p className="text-xs text-navy-400">Past</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-navy-600">
                      {formatDateTime(event.startsAt)}
                    </td>
                    <td className="px-4 py-3.5 text-navy-600">{event.city ?? "—"}</td>
                    <td className="px-4 py-3.5">
                      {event.isPublished ? (
                        <Badge tone="green">Published</Badge>
                      ) : (
                        <Badge tone="gray">Draft</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-navy-800">
                      {going}
                      {event.capacity !== null ? (
                        <span className="text-navy-400"> / {event.capacity}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5 text-navy-800">{waitlist}</td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-right">
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="font-medium text-navy-700 underline-offset-2 hover:underline"
                      >
                        Edit
                      </Link>
                      <span className="mx-2 text-navy-200">|</span>
                      <Link
                        href={`/admin/events/${event.id}/rsvps`}
                        className="font-medium text-navy-700 underline-offset-2 hover:underline"
                      >
                        RSVPs
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
