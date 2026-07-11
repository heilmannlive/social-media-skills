import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { apply } from "../actions";

export const metadata: Metadata = { title: "Apply to join" };

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Please complete all fields — every answer helps the board get to know you.",
  password: "Please choose a password of at least 10 characters.",
  email_taken: "An account with this email already exists. Try signing in instead.",
  code_invalid:
    "That invitation code isn't valid. Double-check it, or leave the field blank to apply for board review.",
  code_expired:
    "That invitation code has expired. Leave the field blank to apply for board review instead.",
  code_exhausted:
    "That invitation code has already been fully redeemed. Leave the field blank to apply for board review instead.",
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const user = await getCurrentUser();
  if (user) redirect(user.status === "ACTIVE" ? "/dashboard" : "/pending");

  const errorKey = typeof sp.error === "string" ? sp.error : "";
  const error = errorKey ? (ERROR_MESSAGES[errorKey] ?? ERROR_MESSAGES.invalid) : null;
  const prev = (key: string): string => (typeof sp[key] === "string" ? (sp[key] as string) : "");

  return (
    <Card className="w-full max-w-xl p-8">
      <h1 className="font-display text-2xl text-navy-950">Apply to join</h1>
      <p className="mt-3 text-sm leading-relaxed text-navy-600">
        The Optimists Club is a private, high-trust community of entrepreneurs, executives,
        athletes, and public servants who believe Europe&apos;s best days are ahead. Every
        application is reviewed personally by the board — tell us who you are and why you want
        to be in the room.
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}

      <form action={apply} className="mt-6 space-y-4">
        <Field label="Full name" htmlFor="name">
          <Input
            id="name"
            name="name"
            autoComplete="name"
            required
            minLength={2}
            defaultValue={prev("name")}
            placeholder="Marie Laurent"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={prev("email")}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Password" htmlFor="password" hint="At least 10 characters.">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" htmlFor="title">
            <Input
              id="title"
              name="title"
              autoComplete="organization-title"
              required
              defaultValue={prev("title")}
              placeholder="Founder & CEO"
            />
          </Field>
          <Field label="Organization" htmlFor="organization">
            <Input
              id="organization"
              name="organization"
              autoComplete="organization"
              required
              defaultValue={prev("organization")}
              placeholder="Aurora Industries"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" htmlFor="city">
            <Input
              id="city"
              name="city"
              autoComplete="address-level2"
              required
              defaultValue={prev("city")}
              placeholder="Berlin"
            />
          </Field>
          <Field label="Country" htmlFor="country">
            <Input
              id="country"
              name="country"
              autoComplete="country-name"
              required
              defaultValue={prev("country")}
              placeholder="Germany"
            />
          </Field>
        </div>

        <Field
          label="Why do you want to join?"
          htmlFor="bio"
          hint="A few honest sentences go further than a polished pitch."
        >
          <Textarea
            id="bio"
            name="bio"
            required
            minLength={10}
            rows={4}
            defaultValue={prev("bio")}
            placeholder="What you're building, what you stand for, and what you hope to contribute."
          />
        </Field>

        <Field
          label="Invitation code (optional)"
          htmlFor="inviteCode"
          hint="Invited by a member? Your code activates membership immediately."
        >
          <Input
            id="inviteCode"
            name="inviteCode"
            autoComplete="off"
            defaultValue={prev("inviteCode")}
            placeholder="e.g. OPT-2026-XXXX"
          />
        </Field>

        <Button type="submit" variant="accent" className="w-full">
          Submit application
        </Button>
      </form>

      <p className="mt-6 border-t border-navy-100 pt-4 text-center text-sm text-navy-500">
        Already a member?{" "}
        <Link href="/login" className="font-semibold text-navy-800 underline hover:text-navy-950">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
