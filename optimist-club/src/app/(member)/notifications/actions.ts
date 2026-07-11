"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const idSchema = z.string().min(1).max(64);

function refreshNotificationViews(): void {
  // The unread badge in the shell renders on every member page.
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

/** Mark every unread notification of the current user as read. */
export async function markAllNotificationsRead(): Promise<void> {
  const user = await requireUser();
  await db.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  refreshNotificationViews();
}

/**
 * Mark a single notification as read and follow its link when it has one.
 * Ownership is enforced: users can only touch their own notifications.
 */
export async function openNotification(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(formData.get("notificationId"));
  if (!parsed.success) redirect("/notifications");

  const notification = await db.notification.findUnique({ where: { id: parsed.data } });
  if (!notification || notification.userId !== user.id) redirect("/notifications");

  if (!notification.readAt) {
    await db.notification.update({
      where: { id: notification.id },
      data: { readAt: new Date() },
    });
  }
  refreshNotificationViews();

  // Only follow in-app links; anything else stays on the notifications page.
  if (notification.href && notification.href.startsWith("/")) redirect(notification.href);
  redirect("/notifications");
}
