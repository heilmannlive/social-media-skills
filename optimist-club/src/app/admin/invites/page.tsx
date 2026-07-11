import { hasRole, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  StatusBadge,
} from "@/components/ui";
import { createInvite } from "./actions";

export const metadata = { title: "Invitations — The Optimist Club" };

const ERRORS: Record<string, string> = {
  "invalid-code": "Custom codes need 4–32 letters, numbers, or dashes (no leading or trailing dash).",
  "invalid-expiry": "Expiry must be between 1 and 365 days.",
  "invalid-input": "Please check the form and try again.",
  "code-taken": "That code already exists. Choose another, or leave the field blank to generate one.",
};

export default async function AdminInvitesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const actor = await requireRole("BOARD");
  const isAdmin = hasRole(actor, "ADMIN");
  const params = await searchParams;

  const invites = await db.inviteCode.findMany({
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const error = params.error ? ERRORS[params.error] : undefined;

  return (
    <div>
      <PageHeader
        title="Invitations"
        subtitle="Membership is by invitation — every code here opens a door."
      />

      {params.created ? (
        <div
          role="status"
          className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          Invitation code{" "}
          <span className="font-mono font-semibold">{params.created}</span> created. Share
          it with your candidate — they can redeem it when joining.
        </div>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      {isAdmin ? (
        <Card className="mb-6">
          <h2 className="mb-1 font-display text-lg text-navy-950">New invitation</h2>
          <p className="mb-4 text-sm text-navy-500">
            Leave the code blank and we&rsquo;ll generate a readable one for you.
          </p>
          <form action={createInvite} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Code (optional)" htmlFor="code" hint="e.g. DAVOS-2026">
              <Input
                id="code"
                name="code"
                maxLength={32}
                placeholder="Auto-generate"
                className="font-mono uppercase"
              />
            </Field>
            <Field label="Grants role" htmlFor="role">
              <Select id="role" name="role" defaultValue="MEMBER">
                <option value="MEMBER">Member</option>
                <option value="BOARD">Board</option>
              </Select>
            </Field>
            <Field label="Max uses" htmlFor="maxUses">
              <Input
                id="maxUses"
                name="maxUses"
                type="number"
                min={1}
                max={500}
                defaultValue={1}
                required
              />
            </Field>
            <Field label="Expires in (days)" htmlFor="expiresInDays" hint="Blank = never">
              <Input id="expiresInDays" name="expiresInDays" type="number" min={1} max={365} />
            </Field>
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit" variant="gold">
                Create invitation
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <p className="mb-6 text-sm text-navy-500">
          Board members can view invitation codes. Creating new ones requires an
          administrator.
        </p>
      )}

      {invites.length === 0 ? (
        <EmptyState
          title="No invitation codes yet"
          description={
            isAdmin
              ? "Create the first code above and hand it to someone worth having at the table."
              : "An administrator hasn't created any codes yet."
          }
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wider text-navy-400">
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Grants</th>
                <th className="px-4 py-3 font-semibold">Uses</th>
                <th className="px-4 py-3 font-semibold">Expires</th>
                <th className="px-4 py-3 font-semibold">Created by</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => {
                const expired = invite.expiresAt !== null && invite.expiresAt < now;
                const exhausted = invite.usedCount >= invite.maxUses;
                return (
                  <tr key={invite.id} className="border-b border-navy-50 last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-navy-950">
                        {invite.code}
                      </span>
                      {expired ? (
                        <Badge tone="red" className="ml-2">
                          Expired
                        </Badge>
                      ) : exhausted ? (
                        <Badge tone="gray" className="ml-2">
                          Used up
                        </Badge>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={invite.role} />
                    </td>
                    <td className="px-4 py-3 text-navy-600">
                      {invite.usedCount} / {invite.maxUses}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-navy-600">
                      {invite.expiresAt ? formatDate(invite.expiresAt) : "Never"}
                    </td>
                    <td className="px-4 py-3 text-navy-600">
                      <span className="block">{invite.createdBy.name}</span>
                      <span className="text-xs text-navy-400">
                        {formatDate(invite.createdAt)}
                      </span>
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
