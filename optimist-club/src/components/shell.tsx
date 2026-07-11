import Link from "next/link";
import type { ReactNode } from "react";
import type { User } from "@prisma/client";
import { hasRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Wordmark } from "@/components/logo";
import { Avatar } from "@/components/ui";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/events", label: "Events" },
  { href: "/members", label: "Members" },
  { href: "/announcements", label: "Announcements" },
  { href: "/membership", label: "Membership" },
  { href: "/account", label: "Account" },
];

const ADMIN_NAV = [
  { href: "/admin/members", label: "Members & applications" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/invites", label: "Invitations" },
];

/**
 * Member-area chrome: top bar with notifications + sidebar navigation.
 * Server component — pass the already-loaded current user.
 */
export async function AppShell({ user, children }: { user: User; children: ReactNode }) {
  const unread = await db.notification.count({
    where: { userId: user.id, readAt: null },
  });
  const isAdmin = hasRole(user, "BOARD");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-navy-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/dashboard">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/notifications"
              className="relative rounded-md p-2 text-navy-700 hover:bg-navy-50"
              aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Zm4 9a2 2 0 0 0 4 0"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {unread > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-navy-950">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Link>
            <Link
              href="/account"
              className="flex items-center gap-2"
              aria-label={`Account — ${user.name}`}
            >
              <Avatar name={user.name} size="sm" />
              <span className="hidden text-sm font-medium text-navy-900 sm:block">
                {user.name}
              </span>
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="rounded-md px-2 py-1.5 text-sm text-navy-500 hover:bg-navy-50 hover:text-navy-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8">
        <nav className="hidden w-48 shrink-0 md:block">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-navy-700 hover:bg-navy-100 hover:text-navy-950"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {isAdmin ? (
            <>
              <p className="mt-6 mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-navy-400">
                Administration
              </p>
              <ul className="space-y-1">
                {ADMIN_NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-navy-700 hover:bg-navy-100 hover:text-navy-950"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </nav>

        <main className="min-w-0 flex-1 pb-16">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-navy-100 bg-white md:hidden">
        <ul className="flex justify-around">
          {[
            ...NAV.slice(0, 4),
            { href: "/account", label: "Account" },
            ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block px-2 py-3 text-[11px] font-medium text-navy-700"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
