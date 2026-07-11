import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { Button, Card } from "@/components/ui";
import { Sunrise } from "@/components/logo";

export const metadata: Metadata = { title: "Application received" };

export default async function PendingPage() {
  const user = await requireUser();
  if (user.status === "ACTIVE") redirect("/dashboard");

  return (
    <Card className="w-full max-w-md p-8 text-center">
      <Sunrise className="mx-auto h-10 w-10 text-gold-500" />
      <h1 className="mt-4 font-display text-2xl text-navy-950">Application received</h1>
      <p className="mt-3 text-sm leading-relaxed text-navy-600">
        Thank you, {user.name.split(/\s+/)[0]}. Your application is now with the board, and
        every one is read personally — no algorithms, no shortcuts. Most decisions take a few
        days; occasionally a board member will reach out to learn more about you first.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-navy-600">
        The moment you&apos;re approved, this account unlocks the full club — events, the member
        directory, and everything in between. We&apos;ll notify you by email at{" "}
        <span className="font-medium text-navy-800">{user.email}</span>.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-navy-600">
        Questions in the meantime? Write to{" "}
        <a
          href="mailto:hello@optimists-club.com"
          className="font-medium text-navy-800 underline hover:text-navy-950"
        >
          hello@optimists-club.com
        </a>
        .
      </p>
      <form action="/api/auth/logout" method="POST" className="mt-6">
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </Card>
  );
}
