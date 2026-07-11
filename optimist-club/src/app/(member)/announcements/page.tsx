import { hasRole, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { Avatar, Badge, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export const metadata = { title: "Announcements — The Optimist Club" };

export default async function AnnouncementsPage() {
  const user = await requireRole("MEMBER");
  const isBoard = hasRole(user, "BOARD");

  const announcements = await db.announcement.findMany({
    where: isBoard ? {} : { audience: "ALL" },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { author: { select: { name: true, role: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="News, decisions, and updates from the club — pinned items first."
      />

      {announcements.length === 0 ? (
        <EmptyState
          title="No announcements yet"
          description="When the board shares club news, it will appear here. Enjoy the quiet — it never lasts long."
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start gap-4">
                <Avatar name={a.author.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg text-navy-950">{a.title}</h2>
                    {a.pinned ? <Badge tone="gold">Pinned</Badge> : null}
                    {a.audience === "BOARD" ? <Badge tone="navy">Board</Badge> : null}
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-navy-400">
                    <span className="font-medium text-navy-600">{a.author.name}</span>
                    <StatusBadge value={a.author.role} />
                    <span>{timeAgo(a.createdAt)}</span>
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-navy-800">
                    {a.body}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
