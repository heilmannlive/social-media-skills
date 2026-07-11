import type { Event } from "@prisma/client";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";

/** Format a Date for a `datetime-local` input (local time, minute precision). */
export function toDateTimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/**
 * Shared create/edit event form (server component). Pass the server action and,
 * when editing, the existing event for default values.
 */
export function EventForm({
  action,
  event,
  error,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  event?: Event;
  error?: string;
  submitLabel: string;
}) {
  return (
    <Card>
      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}

      <form action={action} className="space-y-5">
        {event ? <input type="hidden" name="eventId" value={event.id} /> : null}

        <Field label="Title" htmlFor="title">
          <Input
            id="title"
            name="title"
            required
            maxLength={200}
            defaultValue={event?.title}
            placeholder="Founders' Dinner: The Long View"
          />
        </Field>

        <Field
          label="Description"
          htmlFor="description"
          hint="What's the occasion, who should come, and what to expect. Plain text; line breaks are preserved."
        >
          <Textarea
            id="description"
            name="description"
            required
            rows={8}
            maxLength={10000}
            defaultValue={event?.description}
            placeholder="An evening for members building for the decade ahead…"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Location" htmlFor="location" hint="Venue name and address.">
            <Input
              id="location"
              name="location"
              required
              maxLength={300}
              defaultValue={event?.location}
              placeholder="Hotel Adlon, Unter den Linden 77"
            />
          </Field>
          <Field label="City" htmlFor="city" hint="Optional.">
            <Input
              id="city"
              name="city"
              maxLength={120}
              defaultValue={event?.city ?? ""}
              placeholder="Berlin"
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Starts" htmlFor="startsAt">
            <Input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={event ? toDateTimeLocalValue(event.startsAt) : ""}
            />
          </Field>
          <Field label="Ends" htmlFor="endsAt" hint="Optional.">
            <Input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              defaultValue={event?.endsAt ? toDateTimeLocalValue(event.endsAt) : ""}
            />
          </Field>
        </div>

        <Field
          label="Capacity"
          htmlFor="capacity"
          hint="Optional. Once this many members are confirmed, further RSVPs join a waitlist."
        >
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            max={100000}
            step={1}
            defaultValue={event?.capacity ?? ""}
            placeholder="Leave blank for unlimited"
            className="max-w-48"
          />
        </Field>

        <label className="flex items-start gap-3 rounded-md border border-navy-200 bg-navy-50/50 px-3 py-3">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={event?.isPublished ?? false}
            className="mt-0.5 h-4 w-4 accent-navy-900"
          />
          <span>
            <span className="block text-sm font-medium text-navy-900">Published</span>
            <span className="block text-xs text-navy-500">
              Published events are visible to all members. The first time an event is
              published, every active member is notified.
            </span>
          </span>
        </label>

        <div className="pt-1">
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Card>
  );
}
