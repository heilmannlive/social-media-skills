import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/shell";

/**
 * Member-area layout: auth gate + app chrome. Pages inside still call
 * requireUser()/requireRole() themselves (cached per request).
 */
export default async function MemberLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}
