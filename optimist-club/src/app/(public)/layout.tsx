import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark, Sunrise } from "@/components/logo";
import { ButtonLink } from "@/components/ui";

const NAV_LINKS = [
  { href: "/#charter", label: "Charter" },
  { href: "/#membership", label: "Membership" },
  { href: "/login", label: "Sign in" },
];

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-navy-100 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="The Optimist Club — home">
            <Wordmark />
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hidden rounded-md px-3 py-2 text-sm font-medium text-navy-700 hover:bg-navy-100 hover:text-navy-950 sm:block"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="rounded-md px-3 py-2 text-sm font-medium text-navy-700 hover:bg-navy-100 hover:text-navy-950 sm:hidden"
            >
              Sign in
            </Link>
            <ButtonLink href="/join" variant="gold" className="ml-1">
              Apply to join
            </ButtonLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-navy-800 bg-navy-950 text-navy-200">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 md:grid-cols-3">
            <div className="md:col-span-1">
              <Wordmark light />
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-navy-300">
                A private community restoring confidence, agency, and
                intellectual courage in Germany and Europe.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">
                Explore
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/#charter" className="hover:text-gold-300">
                    Our charter
                  </Link>
                </li>
                <li>
                  <Link href="/#membership" className="hover:text-gold-300">
                    Membership
                  </Link>
                </li>
                <li>
                  <Link href="/join" className="hover:text-gold-300">
                    Apply to join
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-gold-300">
                    Member sign in
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">
                Contact
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <a
                    href="mailto:hello@optimists-club.com"
                    className="hover:text-gold-300"
                  >
                    hello@optimists-club.com
                  </a>
                </li>
                <li className="text-navy-300">Berlin · Munich · Europe</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-navy-800 pt-6 text-xs text-navy-400">
            <p className="inline-flex items-center gap-2">
              <Sunrise className="h-4 w-4 text-gold-500" />
              The Optimist Club — optimists-club.com
            </p>
            <p>&copy; 2026 The Optimist Club. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
