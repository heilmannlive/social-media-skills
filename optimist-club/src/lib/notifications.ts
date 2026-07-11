import "server-only";
import { db } from "@/lib/db";

/** Create an in-app notification for one user. */
export async function notifyUser(
  userId: string,
  input: { title: string; body?: string; href?: string }
): Promise<void> {
  await db.notification.create({ data: { userId, ...input } });
}

/**
 * Fan a notification out to all ACTIVE members (optionally restricted to a
 * minimum role), excluding `excludeUserId` (usually the actor).
 */
export async function notifyMembers(
  input: { title: string; body?: string; href?: string },
  opts: { minRole?: "MEMBER" | "BOARD" | "ADMIN"; excludeUserId?: string } = {}
): Promise<number> {
  const roles =
    opts.minRole === "ADMIN"
      ? ["ADMIN"]
      : opts.minRole === "BOARD"
        ? ["BOARD", "ADMIN"]
        : ["MEMBER", "BOARD", "ADMIN"];

  const users = await db.user.findMany({
    where: {
      status: "ACTIVE",
      role: { in: roles },
      ...(opts.excludeUserId ? { id: { not: opts.excludeUserId } } : {}),
    },
    select: { id: true },
  });
  if (users.length === 0) return 0;

  await db.notification.createMany({
    data: users.map((u) => ({ userId: u.id, ...input })),
  });
  return users.length;
}
