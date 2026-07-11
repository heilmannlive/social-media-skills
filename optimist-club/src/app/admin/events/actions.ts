"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { notifyMembers, notifyUser } from "@/lib/notifications";

const idSchema = z.string().min(1).max(64);

const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
    description: z
      .string()
      .trim()
      .min(10, "Please write a short description (at least 10 characters)")
      .max(10000),
    location: z.string().trim().min(2, "Location is required").max(300),
    city: z
      .string()
      .trim()
      .max(120)
      .transform((v) => (v === "" ? null : v)),
    startsAt: z
      .string()
      .min(1, "Start date and time are required")
      .transform((v) => new Date(v))
      .refine((d) => !Number.isNaN(d.getTime()), "Start date is not a valid date"),
    endsAt: z
      .string()
      .transform((v) => (v === "" ? null : new Date(v)))
      .refine((d) => d === null || !Number.isNaN(d.getTime()), "End date is not a valid date"),
    capacity: z
      .string()
      .trim()
      .transform((v) => (v === "" ? null : Number(v)))
      .refine(
        (n) => n === null || (Number.isInteger(n) && n >= 1 && n <= 100000),
        "Capacity must be a whole number of at least 1"
      ),
    isPublished: z.boolean(),
  })
  .refine((data) => data.endsAt === null || data.endsAt > data.startsAt, {
    message: "End time must be after the start time",
    path: ["endsAt"],
  });

function readEventForm(formData: FormData) {
  return eventSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    location: String(formData.get("location") ?? ""),
    city: String(formData.get("city") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? ""),
    capacity: String(formData.get("capacity") ?? ""),
    isPublished: formData.get("isPublished") === "on",
  });
}

function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

/** Echoed back into the form after a validation redirect so drafts survive. */
const ECHO_FIELDS = [
  "title",
  "description",
  "location",
  "city",
  "startsAt",
  "endsAt",
  "capacity",
] as const;

function eventFormFail(basePath: string, error: string, formData: FormData): never {
  const params = new URLSearchParams({ error });
  for (const key of ECHO_FIELDS) {
    const value = formData.get(key);
    if (typeof value === "string" && value) params.set(key, value.slice(0, 10000));
  }
  if (formData.get("isPublished") === "on") params.set("isPublished", "on");
  redirect(`${basePath}?${params.toString()}`);
}

/**
 * Fill newly freed seats from the waitlist (oldest first) and return the
 * promoted user ids. Runs after capacity edits; a lowered capacity simply
 * promotes no one.
 */
async function promoteFromWaitlist(eventId: string): Promise<string[]> {
  return db.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) return [];
    let free = Number.POSITIVE_INFINITY;
    if (event.capacity !== null) {
      const going = await tx.rsvp.count({ where: { eventId, status: "GOING" } });
      free = event.capacity - going;
    }
    if (free <= 0) return [];
    const next = await tx.rsvp.findMany({
      where: { eventId, status: "WAITLIST" },
      orderBy: { createdAt: "asc" },
      ...(Number.isFinite(free) ? { take: free } : {}),
    });
    if (next.length === 0) return [];
    await tx.rsvp.updateMany({
      where: { id: { in: next.map((r) => r.id) } },
      data: { status: "GOING" },
    });
    return next.map((r) => r.userId);
  });
}

function refreshEventViews(eventId?: string): void {
  revalidatePath("/admin/events");
  revalidatePath("/events");
  if (eventId) {
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/admin/events/${eventId}/edit`);
    revalidatePath(`/admin/events/${eventId}/rsvps`);
  }
}

async function announceEvent(
  event: { id: string; title: string; city: string | null; startsAt: Date },
  actorId: string
): Promise<void> {
  await notifyMembers(
    {
      title: `New event: ${event.title}`,
      body: [event.city, formatDateTime(event.startsAt)].filter(Boolean).join(" · "),
      href: `/events/${event.id}`,
    },
    { excludeUserId: actorId }
  );
}

export async function createEvent(formData: FormData): Promise<void> {
  const actor = await requireRole("BOARD");
  const parsed = readEventForm(formData);
  if (!parsed.success) {
    eventFormFail("/admin/events/new", firstError(parsed.error), formData);
  }

  const data = parsed.data;
  const event = await db.event.create({
    data: {
      title: data.title,
      description: data.description,
      location: data.location,
      city: data.city,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      capacity: data.capacity,
      isPublished: data.isPublished,
      createdById: actor.id,
    },
  });

  // Created directly as published counts as the first publish.
  if (event.isPublished) await announceEvent(event, actor.id);

  refreshEventViews(event.id);
  redirect("/admin/events");
}

export async function updateEvent(formData: FormData): Promise<void> {
  const actor = await requireRole("BOARD");
  const idParsed = idSchema.safeParse(formData.get("eventId"));
  if (!idParsed.success) redirect("/admin/events");
  const eventId = idParsed.data;

  const parsed = readEventForm(formData);
  if (!parsed.success) {
    eventFormFail(`/admin/events/${eventId}/edit`, firstError(parsed.error), formData);
  }

  const existing = await db.event.findUnique({ where: { id: eventId } });
  if (!existing) redirect("/admin/events");

  const data = parsed.data;
  const event = await db.event.update({
    where: { id: eventId },
    data: {
      title: data.title,
      description: data.description,
      location: data.location,
      city: data.city,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      capacity: data.capacity,
      isPublished: data.isPublished,
    },
  });

  // Notify the club only on the first transition from draft to published.
  if (!existing.isPublished && event.isPublished) await announceEvent(event, actor.id);

  // A raised (or removed) capacity frees seats: waitlisted members are
  // promoted in queue order, exactly as when a confirmed member declines.
  const capacityLoosened =
    event.capacity === null
      ? existing.capacity !== null
      : existing.capacity !== null && event.capacity > existing.capacity;
  if (capacityLoosened) {
    const promoted = await promoteFromWaitlist(event.id);
    for (const userId of promoted) {
      await notifyUser(userId, {
        title: "A spot opened up — you are in",
        body: `You have been moved off the waitlist for “${event.title}”. Your spot is confirmed.`,
        href: `/events/${event.id}`,
      });
    }
  }

  refreshEventViews(event.id);
  redirect("/admin/events");
}

export async function deleteEvent(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const idParsed = idSchema.safeParse(formData.get("eventId"));
  if (!idParsed.success) redirect("/admin/events");
  const eventId = idParsed.data;

  // Deletion must come from the explicit confirmation UI.
  if (formData.get("confirm") !== "1") {
    redirect(
      `/admin/events/${eventId}/edit?error=${encodeURIComponent(
        "Deletion was not confirmed. Use the confirmation prompt to delete an event."
      )}`
    );
  }

  const existing = await db.event.findUnique({ where: { id: eventId } });
  if (existing) {
    await db.event.delete({ where: { id: eventId } });
  }

  refreshEventViews();
  redirect("/admin/events");
}
