import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { markAllNotificationsRead, openNotification } from "./actions";

export const metadata = { title: "Notifications — The Optimist Club" };

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread ${unreadCount === 1 ? "notification" : "notifications"}.`
            : "Everything the club wanted you to know."
        }
        actions={
          unreadCount > 0 ? (
            <form action={markAllNotificationsRead}>
              <Button type="submit" variant="outline">
                Mark all read
              </Button>
            </form>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          title="You are all caught up"
          description="New announcements, events, and membership updates will land here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const unread = !n.readAt;
            return (
              <Card
                key={n.id}
                className={`p-0 ${unread ? "border-l-4 border-l-gold-500" : ""}`}
              >
                <form action={openNotification}>
                  <input type="hidden" name="notificationId" value={n.id} />
                  <button
                    type="submit"
                    className="block w-full rounded-xl px-5 py-4 text-left transition-colors hover:bg-navy-50/60"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p
                        className={`text-sm ${
                          unread ? "font-semibold text-navy-950" : "font-medium text-navy-700"
                        }`}
                      >
                        {n.title}
                      </p>
                      <span className="shrink-0 text-xs text-navy-400">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    {n.body ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-navy-500">{n.body}</p>
                    ) : null}
                    {n.href ? (
                      <p className="mt-2 text-xs font-semibold text-navy-600">
                        Open {unread ? "and mark read" : ""} →
                      </p>
                    ) : unread ? (
                      <p className="mt-2 text-xs font-semibold text-navy-600">Mark as read</p>
                    ) : null}
                  </button>
                </form>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
