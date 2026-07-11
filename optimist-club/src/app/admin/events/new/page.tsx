import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { createEvent } from "../actions";
import { EventForm, type EventFormEcho } from "../event-form";

export const metadata = { title: "New event — Admin — The Optimists Club" };

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string } & EventFormEcho>;
}) {
  await requireRole("BOARD");
  const { error, ...echo } = await searchParams;

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
          title="New event"
          subtitle="Draft it quietly or publish right away — publishing notifies every active member."
        />
      </div>
      <EventForm action={createEvent} error={error} echo={echo} submitLabel="Create event" />
    </div>
  );
}
