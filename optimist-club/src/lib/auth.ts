import "server-only";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { getSessionPayload } from "@/lib/session";
import type { User } from "@prisma/client";

export const ROLES = ["PENDING", "MEMBER", "BOARD", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

const ROLE_RANK: Record<string, number> = { PENDING: 0, MEMBER: 1, BOARD: 2, ADMIN: 3 };

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Load the current user from the session cookie, re-checking the database so
 * that role/status changes take effect immediately (the JWT role is only a
 * hint for middleware). Returns null when logged out or the account is gone.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const payload = await getSessionPayload();
  if (!payload) return null;
  const user = await db.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.status === "SUSPENDED") return null;
  return user;
});

/** Redirects to /login when logged out. Use in member-area pages/actions. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Requires an ACTIVE account with at least the given role.
 * PENDING applicants are sent to the waiting page.
 */
export async function requireRole(minRole: Role): Promise<User> {
  const user = await requireUser();
  if (user.status !== "ACTIVE" || (ROLE_RANK[user.role] ?? 0) < ROLE_RANK[minRole]) {
    if (user.role === "PENDING" || user.status === "PENDING") redirect("/pending");
    redirect("/dashboard");
  }
  return user;
}

/** Non-redirecting role check for conditional UI. */
export function hasRole(user: Pick<User, "role" | "status">, minRole: Role): boolean {
  return user.status === "ACTIVE" && (ROLE_RANK[user.role] ?? 0) >= ROLE_RANK[minRole];
}
