import Link from "next/link";
import { notFound } from "next/navigation";
import { hasRole, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button, Card, PageHeader } from "@/components/ui";
import { deleteAnnouncement, updateAnnouncement } from "../../actions";
import { AnnouncementForm } from "../../announcement-form";

export const metadata = { title: "Edit announcement — Admin — The Optimist Club" };

export default async function EditAnnouncementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireRole("BOARD");
  const [{ id }, { error }] = await Promise.all([params, searchParams]);

  const announcement = await db.announcement.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true } } },
  });
  if (!announcement) notFound();

  const canDelete = hasRole(user, "ADMIN") || announcement.author.id === user.id;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/announcements"
        className="text-sm font-medium text-navy-500 hover:text-navy-800"
      >
        ← All announcements
      </Link>
      <div className="mt-2">
        <PageHeader
          title="Edit announcement"
          subtitle={`Posted by ${announcement.author.name}. Edits update the post in place — members are not re-notified.`}
        />
      </div>

      <AnnouncementForm
        action={updateAnnouncement}
        announcement={announcement}
        error={error}
        submitLabel="Save changes"
      />

      {canDelete ? (
        <div id="delete">
        <Card className="mt-6 border-red-200">
          <h2 className="font-display text-lg text-red-800">Delete this announcement</h2>
          <p className="mt-1 text-sm text-navy-600">
            Deleting removes the post for everyone. This cannot be undone.
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold text-red-700 underline-offset-2 hover:underline">
              I understand — delete this announcement
            </summary>
            <form action={deleteAnnouncement} className="mt-3 flex items-center gap-3">
              <input type="hidden" name="announcementId" value={announcement.id} />
              <input type="hidden" name="confirm" value="1" />
              <Button type="submit" variant="danger">
                Yes, permanently delete &ldquo;{announcement.title}&rdquo;
              </Button>
            </form>
          </details>
        </Card>
        </div>
      ) : null}
    </div>
  );
}
