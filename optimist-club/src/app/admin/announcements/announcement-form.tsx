import type { Announcement } from "@prisma/client";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";

/**
 * Shared create/edit form for announcements. Server component — plain form
 * posting to a server action; errors arrive via the `error` query param.
 */
export function AnnouncementForm({
  action,
  announcement,
  error,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  announcement?: Announcement;
  error?: string;
  submitLabel: string;
}) {
  return (
    <Card>
      {error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <form action={action} className="space-y-4">
        {announcement ? (
          <input type="hidden" name="announcementId" value={announcement.id} />
        ) : null}

        <Field label="Title" htmlFor="title">
          <Input
            id="title"
            name="title"
            required
            maxLength={200}
            defaultValue={announcement?.title}
            placeholder="Spring assembly: save the date"
          />
        </Field>

        <Field label="Body" htmlFor="body" hint="Plain text. Line breaks are preserved.">
          <Textarea
            id="body"
            name="body"
            required
            rows={8}
            maxLength={20000}
            defaultValue={announcement?.body}
            placeholder="Share the news, the context, and what you need from members."
          />
        </Field>

        <div className="flex flex-wrap items-end gap-6">
          <div className="w-full max-w-xs">
            <Field
              label="Audience"
              htmlFor="audience"
              hint="Board only posts are visible to board members and admins."
            >
              <Select id="audience" name="audience" defaultValue={announcement?.audience ?? "ALL"}>
                <option value="ALL">All members</option>
                <option value="BOARD">Board only</option>
              </Select>
            </Field>
          </div>
          <label className="mb-1 flex items-center gap-2 pb-1 text-sm font-medium text-navy-800">
            <input
              type="checkbox"
              name="pinned"
              defaultChecked={announcement?.pinned ?? false}
              className="h-4 w-4 rounded border-navy-300 accent-navy-900"
            />
            Pin to the top
          </label>
        </div>

        <div className="pt-2">
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Card>
  );
}
