"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hasRole, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyMembers } from "@/lib/notifications";

const idSchema = z.string().min(1).max(64);

const announcementSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  body: z
    .string()
    .trim()
    .min(10, "Please write a short body (at least 10 characters)")
    .max(20000),
  audience: z.enum(["ALL", "BOARD"], { message: "Audience must be All members or Board only" }),
  pinned: z.boolean(),
});

function readAnnouncementForm(formData: FormData) {
  return announcementSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    audience: String(formData.get("audience") ?? ""),
    pinned: formData.get("pinned") === "on",
  });
}

function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

function refreshAnnouncementViews(id?: string): void {
  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/admin/announcements/${id}/edit`);
}

export async function createAnnouncement(formData: FormData): Promise<void> {
  const actor = await requireRole("BOARD");
  const parsed = readAnnouncementForm(formData);
  if (!parsed.success) {
    redirect(`/admin/announcements?error=${encodeURIComponent(firstError(parsed.error))}`);
  }

  const data = parsed.data;
  await db.announcement.create({
    data: {
      title: data.title,
      body: data.body,
      audience: data.audience,
      pinned: data.pinned,
      authorId: actor.id,
    },
  });

  await notifyMembers(
    { title: `New announcement: ${data.title}`, href: "/announcements" },
    data.audience === "BOARD"
      ? { minRole: "BOARD", excludeUserId: actor.id }
      : { excludeUserId: actor.id }
  );

  refreshAnnouncementViews();
  redirect("/admin/announcements");
}

export async function updateAnnouncement(formData: FormData): Promise<void> {
  await requireRole("BOARD");
  const idParsed = idSchema.safeParse(formData.get("announcementId"));
  if (!idParsed.success) redirect("/admin/announcements");
  const announcementId = idParsed.data;

  const parsed = readAnnouncementForm(formData);
  if (!parsed.success) {
    redirect(
      `/admin/announcements/${announcementId}/edit?error=${encodeURIComponent(
        firstError(parsed.error)
      )}`
    );
  }

  const existing = await db.announcement.findUnique({ where: { id: announcementId } });
  if (!existing) redirect("/admin/announcements");

  const data = parsed.data;
  await db.announcement.update({
    where: { id: announcementId },
    data: {
      title: data.title,
      body: data.body,
      audience: data.audience,
      pinned: data.pinned,
    },
  });

  refreshAnnouncementViews(announcementId);
  redirect("/admin/announcements");
}

export async function deleteAnnouncement(formData: FormData): Promise<void> {
  const actor = await requireRole("BOARD");
  const idParsed = idSchema.safeParse(formData.get("announcementId"));
  if (!idParsed.success) redirect("/admin/announcements");
  const announcementId = idParsed.data;

  // Deletion must come from the explicit confirmation UI.
  if (formData.get("confirm") !== "1") {
    redirect(
      `/admin/announcements/${announcementId}/edit?error=${encodeURIComponent(
        "Deletion was not confirmed. Use the confirmation prompt to delete an announcement."
      )}`
    );
  }

  const existing = await db.announcement.findUnique({ where: { id: announcementId } });
  if (existing) {
    // Admins may delete anything; board members may delete their own posts.
    if (!hasRole(actor, "ADMIN") && existing.authorId !== actor.id) {
      redirect(
        `/admin/announcements/${announcementId}/edit?error=${encodeURIComponent(
          "Only an admin or the author can delete this announcement."
        )}`
      );
    }
    await db.announcement.delete({ where: { id: announcementId } });
  }

  refreshAnnouncementViews();
  redirect("/admin/announcements");
}
