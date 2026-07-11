import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/logo";

// Auth-area chrome: a quiet, centered column on the paper background.
// Individual pages control their own card width.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10 sm:justify-center sm:py-16">
      <Link href="/" className="mb-8" aria-label="The Optimists Club — home">
        <Wordmark />
      </Link>
      <div className="flex w-full flex-col items-center">{children}</div>
      <p className="mt-10 text-xs text-navy-400">
        A private community · Questions?{" "}
        <a href="mailto:hello@optimists-club.com" className="underline hover:text-navy-600">
          hello@optimists-club.com
        </a>
      </p>
    </div>
  );
}
