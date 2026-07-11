import Link from "next/link";
import type { User } from "@prisma/client";
import { hasRole, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, timeAgo } from "@/lib/format";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
import {
  approveApplication,
  changeRole,
  declineApplication,
  reactivateMember,
  suspendMember,
} from "./actions";

export const metadata = { title: "Members & applications — The Optimists Club" };

const FILTERS = ["ALL", "PENDING", "ACTIVE", "SUSPENDED"] as const;
type Filter = (typeof FILTERS)[number];

const NOTICES: Record<string, string> = {
  approved: "Application approved. The new member has been notified.",
  declined: "Application declined and removed.",
  suspended: "Membership suspended.",
  reactivated: "Membership reinstated. The member has been notified.",
  "role-changed": "Role updated.",
};

const ERRORS: Record<string, string> = {
  "not-found": "That account no longer exists.",
  "not-pending": "That account is no longer a pending application.",
  "not-active": "That action only applies to active members.",
  "not-suspended": "That member is not suspended.",
  "cannot-suspend-self": "You cannot suspend your own account.",
  "cannot-suspend-admin": "Administrators cannot be suspended from here.",
  "role-locked": "Administrator roles cannot be changed from here.",
};

function RowActions({ user, actorIsAdmin, actorId }: { user: User; actorIsAdmin: boolean; actorId: string }) {
  if (user.status === "PENDING") {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        <form action={approveApplication}>
          <input type="hidden" name="userId" value={user.id} />
          <Button type="submit" variant="accent" className="px-3 py-1.5 text-xs">
            Approve
          </Button>
        </form>
        <form action={declineApplication}>
          <input type="hidden" name="userId" value={user.id} />
          <Button type="submit" variant="outline" className="px-3 py-1.5 text-xs">
            Decline
          </Button>
        </form>
      </div>
    );
  }

  if (!actorIsAdmin) return null;

  if (user.status === "SUSPENDED") {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        <form action={reactivateMember}>
          <input type="hidden" name="userId" value={user.id} />
          <Button type="submit" variant="outline" className="px-3 py-1.5 text-xs">
            Reactivate
          </Button>
        </form>
      </div>
    );
  }

  // ACTIVE users
  const canChangeRole = user.role === "MEMBER" || user.role === "BOARD";
  const canSuspend = user.role !== "ADMIN" && user.id !== actorId;
  if (!canChangeRole && !canSuspend) return null;

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {canChangeRole ? (
        <form action={changeRole}>
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="role" value={user.role === "MEMBER" ? "BOARD" : "MEMBER"} />
          <Button type="submit" variant="ghost" className="px-3 py-1.5 text-xs">
            {user.role === "MEMBER" ? "Promote to board" : "Move to member"}
          </Button>
        </form>
      ) : null}
      {canSuspend ? (
        <form action={suspendMember}>
          <input type="hidden" name="userId" value={user.id} />
          <Button type="submit" variant="danger" className="px-3 py-1.5 text-xs">
            Suspend
          </Button>
        </form>
      ) : null}
    </div>
  );
}

/**
 * Pending applications get a full card so the board can review what the
 * applicant actually submitted before approving or declining.
 */
function ApplicationCards({ users }: { users: User[] }) {
  return (
    <div className="space-y-3">
      {users.map((u) => (
        <div key={u.id} className="rounded-lg border border-navy-100 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={u.name} size="md" />
              <div>
                <p className="font-semibold text-navy-950">{u.name}</p>
                <p className="text-xs text-navy-500">
                  {[u.title, u.organization].filter(Boolean).join(" · ") || "—"}
                </p>
                <p className="text-xs text-navy-400">
                  {[u.city, u.country].filter(Boolean).join(", ")}
                  {u.city || u.country ? " · " : ""}
                  {u.email} · applied {timeAgo(u.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={approveApplication}>
                <input type="hidden" name="userId" value={u.id} />
                <Button type="submit" variant="accent" className="px-3 py-1.5 text-xs">
                  Approve
                </Button>
              </form>
              <form action={declineApplication}>
                <input type="hidden" name="userId" value={u.id} />
                <Button type="submit" variant="outline" className="px-3 py-1.5 text-xs">
                  Decline
                </Button>
              </form>
            </div>
          </div>
          {u.bio ? (
            <blockquote className="mt-3 border-l-2 border-accent-400 pl-3 text-sm leading-relaxed text-navy-700 whitespace-pre-wrap">
              {u.bio}
            </blockquote>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function MembersTable({
  users,
  actorIsAdmin,
  actorId,
}: {
  users: User[];
  actorIsAdmin: boolean;
  actorId: string;
}) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-navy-100 text-xs uppercase tracking-wider text-navy-400">
            <th className="px-4 py-3 font-semibold">Member</th>
            <th className="px-4 py-3 font-semibold">Role</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Since</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-navy-50 last:border-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} size="sm" />
                  <div className="min-w-0">
                    <p className="font-medium text-navy-950">
                      {u.status === "ACTIVE" && u.role !== "PENDING" ? (
                        <Link href={`/members/${u.id}`} className="hover:underline">
                          {u.name}
                        </Link>
                      ) : (
                        u.name
                      )}
                    </p>
                    <p className="truncate text-xs text-navy-400">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge value={u.role} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge value={u.status} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-navy-600">
                {u.memberSince ? formatDate(u.memberSince) : `Applied ${timeAgo(u.createdAt)}`}
              </td>
              <td className="px-4 py-3">
                <RowActions user={u} actorIsAdmin={actorIsAdmin} actorId={actorId} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; notice?: string; error?: string }>;
}) {
  const actor = await requireRole("BOARD");
  const actorIsAdmin = hasRole(actor, "ADMIN");
  const params = await searchParams;

  const filter: Filter = FILTERS.includes(params.status as Filter)
    ? (params.status as Filter)
    : "ALL";

  const users = await db.user.findMany({
    where: filter === "ALL" ? {} : { status: filter },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  const pending = filter === "ALL" ? users.filter((u) => u.status === "PENDING") : [];
  const rest = filter === "ALL" ? users.filter((u) => u.status !== "PENDING") : users;

  const notice = params.notice ? NOTICES[params.notice] : undefined;
  const error = params.error ? ERRORS[params.error] : undefined;

  return (
    <div>
      <PageHeader
        title="Members & applications"
        subtitle="Approve applications, manage roles, and keep the roster in good order."
      />

      {notice ? (
        <div
          role="status"
          className="mb-6 rounded-md border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800"
        >
          {notice}
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

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "ALL" ? "/admin/members" : `/admin/members?status=${f}`}
            className={
              f === filter
                ? "rounded-md bg-navy-900 px-3 py-1.5 text-sm font-semibold text-white"
                : "rounded-md px-3 py-1.5 text-sm font-medium text-navy-600 hover:bg-navy-100 hover:text-navy-950"
            }
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {filter === "ALL" && pending.length > 0 ? (
        <div className="mb-8">
          <div className="rounded-xl border border-accent-500/40 bg-accent-100/40 p-4">
            <h2 className="mb-3 font-display text-lg text-navy-950">
              Pending applications ({pending.length})
            </h2>
            <ApplicationCards users={pending} />
          </div>
        </div>
      ) : null}

      {rest.length === 0 && (filter !== "ALL" || pending.length === 0) ? (
        <EmptyState
          title={
            filter === "PENDING"
              ? "No pending applications"
              : filter === "SUSPENDED"
                ? "No suspended members"
                : filter === "ACTIVE"
                  ? "No active members yet"
                  : "No members yet"
          }
          description={
            filter === "PENDING"
              ? "Every application has been reviewed. New ones will appear here."
              : filter === "SUSPENDED"
                ? "The roster is in good standing across the board."
                : "Share an invitation code to bring in the first members."
          }
        />
      ) : rest.length > 0 ? (
        filter === "PENDING" ? (
          <ApplicationCards users={rest} />
        ) : (
          <MembersTable users={rest} actorIsAdmin={actorIsAdmin} actorId={actor.id} />
        )
      ) : null}

      {!actorIsAdmin ? (
        <p className="mt-4 text-xs text-navy-400">
          As a board member you can approve and decline applications. Suspensions and role
          changes require an administrator.
        </p>
      ) : null}
    </div>
  );
}
