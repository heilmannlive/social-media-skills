import Link from "next/link";
import { hasRole, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { createAnnouncement } from "./actions";
import { AnnouncementForm } from "./announcement-form";

export const metadata = { title: "Announcements — Admin — The Optimist Club" };

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireRole("BOARD");
  const { error } = await searchParams;
  const isAdmin = hasRole(user, "ADMIN");

  const announcements = await db.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { author: { select: { id: true, name: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="Publish club news. Members are notified the moment you post."
      />

      <div className="mb-8">
        <h2 className="mb-3 font-display text-xl text-navy-900">New announcement</h2>
        <AnnouncementForm action={createAnnouncement} error={error} submitLabel="Publish announcement" />
      </div>

      <h2 className="mb-3 font-display text-xl text-navy-900">All announcements</h2>
      {announcements.length === 0 ? (
        <EmptyState
          title="Nothing published yet"
          description="Your first announcement will greet every member on their dashboard. Make it count."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wider text-navy-400">
                <th className="px-6 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Audience</th>
                <th className="px-4 py-3 font-semibold">Pinned</th>
                <th className="px-4 py-3 font-semibold">Author</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {announcements.map((a) => {
                const canDelete = isAdmin || a.author.id === user.id;
                return (
                  <tr key={a.id} className="hover:bg-navy-50/60">
                    <td className="max-w-xs px-6 py-3.5">
                      <p className="truncate font-semibold text-navy-900">{a.title}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {a.audience === "BOARD" ? (
                        <Badge tone="navy">Board</Badge>
                      ) : (
                        <Badge tone="gray">All members</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {a.pinned ? <Badge tone="gold">Pinned</Badge> : <span className="text-navy-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-navy-600">{a.author.name}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-navy-600">
                      {formatDate(a.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-right">
                      <Link
                        href={`/admin/announcements/${a.id}/edit`}
                        className="font-medium text-navy-700 underline-offset-2 hover:underline"
                      >
                        Edit
                      </Link>
                      {canDelete ? (
                        <>
                          <span className="mx-2 text-navy-200">|</span>
                          {/* Deleting is permanent, so it lives behind the
                              confirmation flow on the edit page — never one
                              click away in a row of links. */}
                          <Link
                            href={`/admin/announcements/${a.id}/edit#delete`}
                            className="font-medium text-red-700 underline-offset-2 hover:underline"
                          >
                            Delete…
                          </Link>
                        </>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
