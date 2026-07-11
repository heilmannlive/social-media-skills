import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/shell";

/**
 * Admin area chrome. Every page below /admin requires at least BOARD.
 * Individual actions re-check roles (some require ADMIN).
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("BOARD");
  return <AppShell user={user}>{children}</AppShell>;
}
