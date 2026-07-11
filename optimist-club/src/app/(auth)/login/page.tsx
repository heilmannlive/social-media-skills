import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Button, Card, Field, Input } from "@/components/ui";
import { login } from "../actions";

export const metadata: Metadata = { title: "Sign in" };

const ERROR_MESSAGES: Record<string, string> = {
  credentials: "Invalid email or password.",
  invalid: "Please enter your email and password.",
  suspended:
    "This account is currently suspended. If you believe this is a mistake, write to the board at hello@optimists-club.com.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const user = await getCurrentUser();
  if (user) redirect(user.status === "ACTIVE" ? "/dashboard" : "/pending");

  const next = typeof sp.next === "string" ? sp.next : "";
  const errorKey = typeof sp.error === "string" ? sp.error : "";
  const error = errorKey ? (ERROR_MESSAGES[errorKey] ?? ERROR_MESSAGES.credentials) : null;

  return (
    <Card className="w-full max-w-md p-8">
      <h1 className="font-display text-2xl text-navy-950">Welcome back</h1>
      <p className="mt-1 text-sm text-navy-500">Sign in to your member account.</p>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}

      <form action={login} className="mt-6 space-y-4">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 border-t border-navy-100 pt-4 text-center text-sm text-navy-500">
        Not a member yet?{" "}
        <Link href="/join" className="font-semibold text-navy-800 underline hover:text-navy-950">
          Apply to join
        </Link>
      </p>
    </Card>
  );
}
