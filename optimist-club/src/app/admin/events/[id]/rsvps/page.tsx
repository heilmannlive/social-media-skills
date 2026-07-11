import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { Avatar, Badge, ButtonLink, Card, PageHeader } from "@/components/ui";

export const metadata = { title: "Event RSVPs — Admin — The Optimist Club" };

type RsvpWithUser = {
  id: string;
  userId: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    title: string | null;
    organization: string | null;
    status: string;
  };
};

function RsvpGroup({
  heading,
  tone,
  rsvps,
  numbered = false,
  emptyText,
}: {
  heading: string;
  tone: "green" | "gold" | "red";
  rsvps: RsvpWithUser[];
  numbered?: boolean;
  emptyText: string;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-display text-lg text-navy-900">{heading}</h2>
        <Badge tone={tone}>{rsvps.length}</Badge>
      </div>
      {rsvps.length === 0 ? (
        <p className="text-sm text-navy-500">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-navy-100">
          {rsvps.map((r, i) => (
            <li key={r.id} className="flex items-center gap-3 py-2.5">
              {numbered ? (
                <span className="w-6 shrink-0 text-right text-sm font-semibold text-navy-400">
                  {i + 1}.
                </span>
              ) : null}
              <Avatar name={r.user.name} size="sm" />
              <div className="min-w-0 flex-1">
                {/* Profile pages only exist for ACTIVE members. */}
                {r.user.status === "ACTIVE" ? (
                  <Link
                    href={`/members/${r.user.id}`}
                    className="block truncate text-sm font-semibold text-navy-900 underline-offset-2 hover:underline"
                  >
                    {r.user.name}
                  </Link>
                ) : (
                  <span className="block truncate text-sm font-semibold text-navy-900">
                    {r.user.name}
                    <span className="ml-2 text-xs font-normal text-navy-400">
                      ({r.user.status.toLowerCase()})
                    </span>
                  </span>
                )}
                {r.user.title || r.user.organization ? (
                  <p className="truncate text-xs text-navy-500">
                    {[r.user.title, r.user.organization].filter(Boolean).join(", ")}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 text-xs text-navy-400">
                {formatDateTime(r.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default async function AdminEventRsvpsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("BOARD");
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
  if (!event) notFound();

  const going = event.rsvps.filter((r) => r.status === "GOING");
  const waitlist = event.rsvps.filter((r) => r.status === "WAITLIST");
  const declined = event.rsvps.filter((r) => r.status === "DECLINED");

  return (
    <div>
      <Link
        href="/admin/events"
        className="text-sm font-medium text-navy-500 hover:text-navy-800"
      >
        ← All events
      </Link>
      <div className="mt-2">
        <PageHeader
          title={`RSVPs — ${event.title}`}
          subtitle={`${formatDateTime(event.startsAt)}${event.city ? ` · ${event.city}` : ""}${
            event.capacity !== null ? ` · ${event.capacity} seats` : ""
          }${event.isPublished ? "" : " · Draft"}`}
          actions={
            <ButtonLink href={`/admin/events/${event.id}/edit`} variant="outline">
              Edit event
            </ButtonLink>
          }
        />
      </div>

      {event.rsvps.length === 0 ? (
        <Card className="py-10 text-center">
          <p className="font-display text-lg text-navy-800">No responses yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-navy-500">
            {event.isPublished
              ? "Members haven't responded to this event yet. RSVPs will appear here as they come in."
              : "This event is still a draft — publish it so members can RSVP."}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <RsvpGroup
            heading="Going"
            tone="green"
            rsvps={going}
            emptyText="No confirmed attendees yet."
          />
          <RsvpGroup
            heading="Waitlist"
            tone="gold"
            rsvps={waitlist}
            numbered
            emptyText="The waitlist is empty."
          />
          <RsvpGroup
            heading="Declined"
            tone="red"
            rsvps={declined}
            emptyText="No one has declined."
          />
        </div>
      )}
    </div>
  );
}
