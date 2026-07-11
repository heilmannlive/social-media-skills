"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";

const rsvpSchema = z.object({
  eventId: z.string().min(1).max(64),
});

function refreshEventViews(eventId: string): void {
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}/rsvps`);
}

/**
 * RSVP "Attend": confirms a spot when one is available, otherwise places the
 * member on the waitlist. Runs inside a transaction so two members cannot
 * both claim the final seat.
 */
export async function attendEvent(formData: FormData): Promise<void> {
  const user = await requireRole("MEMBER");
  const parsed = rsvpSchema.safeParse({ eventId: formData.get("eventId") });
  if (!parsed.success) redirect("/events");
  const { eventId } = parsed.data;

  const outcome = await db.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event || !event.isPublished) return "missing" as const;
    if (event.startsAt < new Date()) return "past" as const;

    const existing = await tx.rsvp.findUnique({
      where: { userId_eventId: { userId: user.id, eventId } },
    });
    if (existing?.status === "GOING") return "unchanged" as const;

    let status: "GOING" | "WAITLIST" = "GOING";
    if (event.capacity !== null) {
      const going = await tx.rsvp.count({ where: { eventId, status: "GOING" } });
      if (going >= event.capacity) status = "WAITLIST";
    }

    if (existing) {
      await tx.rsvp.update({
        where: { id: existing.id },
        // Joining the waitlist starts a fresh queue position, even for a
        // member who previously declined.
        data: { status, ...(status === "WAITLIST" ? { createdAt: new Date() } : {}) },
      });
    } else {
      await tx.rsvp.create({ data: { userId: user.id, eventId, status } });
    }
    return status === "WAITLIST" ? ("waitlisted" as const) : ("confirmed" as const);
  });

  if (outcome === "missing") redirect("/events");
  refreshEventViews(eventId);
  redirect(`/events/${eventId}`);
}

/**
 * RSVP "Cannot make it": marks the member as declined. If they held a
 * confirmed spot at a capacity-limited event, the longest-waiting member is
 * promoted from the waitlist and notified.
 */
export async function declineEvent(formData: FormData): Promise<void> {
  const user = await requireRole("MEMBER");
  const parsed = rsvpSchema.safeParse({ eventId: formData.get("eventId") });
  if (!parsed.success) redirect("/events");
  const { eventId } = parsed.data;

  const result = await db.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event || !event.isPublished) return { outcome: "missing" as const };
    if (event.startsAt < new Date()) return { outcome: "past" as const };

    const existing = await tx.rsvp.findUnique({
      where: { userId_eventId: { userId: user.id, eventId } },
    });
    const wasGoing = existing?.status === "GOING";

    if (existing) {
      if (existing.status !== "DECLINED") {
        await tx.rsvp.update({ where: { id: existing.id }, data: { status: "DECLINED" } });
      }
    } else {
      await tx.rsvp.create({ data: { userId: user.id, eventId, status: "DECLINED" } });
    }

    // A confirmed spot just opened at a capacity-limited event: promote the
    // member who has been waiting the longest.
    if (wasGoing && event.capacity !== null) {
      const next = await tx.rsvp.findFirst({
        where: { eventId, status: "WAITLIST" },
        orderBy: { createdAt: "asc" },
      });
      if (next) {
        await tx.rsvp.update({ where: { id: next.id }, data: { status: "GOING" } });
        return {
          outcome: "declined" as const,
          promotedUserId: next.userId,
          eventTitle: event.title,
        };
      }
    }
    return { outcome: "declined" as const };
  });

  if (result.outcome === "missing") redirect("/events");

  if (result.outcome === "declined" && result.promotedUserId) {
    await notifyUser(result.promotedUserId, {
      title: "A spot opened up — you are in",
      body: `You have been moved off the waitlist for “${result.eventTitle}”. Your spot is confirmed.`,
      href: `/events/${eventId}`,
    });
  }

  refreshEventViews(eventId);
  redirect(`/events/${eventId}`);
}
