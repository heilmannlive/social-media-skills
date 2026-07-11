import Link from "next/link";
import { notFound } from "next/navigation";
import { hasRole, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button, ButtonLink, Card, PageHeader } from "@/components/ui";
import { deleteEvent, updateEvent } from "../../actions";
import { EventForm } from "../../event-form";

export const metadata = { title: "Edit event — Admin — The Optimist Club" };

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireRole("BOARD");
  const [{ id }, { error }] = await Promise.all([params, searchParams]);

  const event = await db.event.findUnique({ where: { id } });
  if (!event) notFound();

  const canDelete = hasRole(user, "ADMIN");

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/events"
        className="text-sm font-medium text-navy-500 hover:text-navy-800"
      >
        ← All events
      </Link>
      <div className="mt-2">
        <PageHeader
          title="Edit event"
          subtitle={event.title}
          actions={
            <ButtonLink href={`/admin/events/${event.id}/rsvps`} variant="outline">
              View RSVPs
            </ButtonLink>
          }
        />
      </div>

      <EventForm action={updateEvent} event={event} error={error} submitLabel="Save changes" />

      {canDelete ? (
        <Card className="mt-6 border-red-200">
          <h2 className="font-display text-lg text-red-800">Delete this event</h2>
          <p className="mt-1 text-sm text-navy-600">
            Deleting removes the event and every RSVP with it. This cannot be undone.
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold text-red-700 underline-offset-2 hover:underline">
              I understand — delete this event
            </summary>
            <form action={deleteEvent} className="mt-3 flex items-center gap-3">
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="confirm" value="1" />
              <Button type="submit" variant="danger">
                Yes, permanently delete “{event.title}”
              </Button>
            </form>
          </details>
        </Card>
      ) : null}
    </div>
  );
}
