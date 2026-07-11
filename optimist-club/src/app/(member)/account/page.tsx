import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import {
  Avatar,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  StatusBadge,
  Textarea,
} from "@/components/ui";
import { changePassword, updateProfile } from "./actions";

export const metadata = { title: "Account — The Optimist Club" };

const MESSAGES: Record<string, { tone: "success" | "error"; text: string }> = {
  "saved:profile": { tone: "success", text: "Your profile has been updated." },
  "saved:password": { tone: "success", text: "Your password has been changed." },
  "error:profile-invalid": {
    tone: "error",
    text: "We couldn't save your profile. Please check that your name is filled in and try again.",
  },
  "error:profile-linkedin": {
    tone: "error",
    text: "That LinkedIn URL doesn't look right. It should start with https://linkedin.com/ or https://www.linkedin.com/.",
  },
  "error:password-short": {
    tone: "error",
    text: "Your new password must be at least 10 characters long.",
  },
  "error:password-wrong": {
    tone: "error",
    text: "Your current password didn't match. Please try again.",
  },
};

function Banner({ messageKey }: { messageKey: string | null }) {
  if (!messageKey) return null;
  const msg = MESSAGES[messageKey];
  if (!msg) return null;
  return (
    <div
      role="status"
      className={
        msg.tone === "success"
          ? "mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          : "mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      }
    >
      {msg.text}
    </div>
  );
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { saved, error } = await searchParams;
  const messageKey = saved ? `saved:${saved}` : error ? `error:${error}` : null;

  return (
    <div>
      <PageHeader
        title="Account"
        subtitle="Keep your profile current — it's how fellow members find you."
      />

      <Banner messageKey={messageKey} />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Avatar name={user.name} size="lg" />
        <div>
          <p className="flex flex-wrap items-center gap-2 font-display text-xl text-navy-950">
            {user.name}
            <StatusBadge value={user.status} />
            {user.role !== "PENDING" ? <StatusBadge value={user.role} /> : null}
          </p>
          <p className="mt-1 text-sm text-navy-500">
            {user.email}
            {user.memberSince ? ` · Member since ${formatDate(user.memberSince)}` : ""}
          </p>
          {user.status === "PENDING" ? (
            <p className="mt-1 text-sm text-navy-500">
              Your application is under review. A complete profile helps the board get to
              know you.
            </p>
          ) : null}
        </div>
      </div>

      <Card className="mb-6">
        <h2 className="mb-4 font-display text-lg text-navy-950">Profile</h2>
        <form action={updateProfile} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name">
              <Input id="name" name="name" required minLength={2} maxLength={120} defaultValue={user.name} />
            </Field>
            <Field label="Title" htmlFor="title" hint='E.g. "Founder & CEO"'>
              <Input id="title" name="title" maxLength={120} defaultValue={user.title ?? ""} />
            </Field>
            <Field label="Organization" htmlFor="organization">
              <Input
                id="organization"
                name="organization"
                maxLength={160}
                defaultValue={user.organization ?? ""}
              />
            </Field>
            <Field label="Phone" htmlFor="phone">
              <Input id="phone" name="phone" type="tel" maxLength={40} defaultValue={user.phone ?? ""} />
            </Field>
            <Field label="City" htmlFor="city">
              <Input id="city" name="city" maxLength={120} defaultValue={user.city ?? ""} />
            </Field>
            <Field label="Country" htmlFor="country">
              <Input id="country" name="country" maxLength={120} defaultValue={user.country ?? ""} />
            </Field>
          </div>
          <Field label="LinkedIn URL" htmlFor="linkedinUrl" hint="https://www.linkedin.com/in/…">
            <Input
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              maxLength={300}
              defaultValue={user.linkedinUrl ?? ""}
            />
          </Field>
          <Field
            label="Expertise"
            htmlFor="expertise"
            hint="Comma-separated, e.g. fintech, public policy, endurance sports"
          >
            <Input
              id="expertise"
              name="expertise"
              maxLength={500}
              defaultValue={user.expertise ?? ""}
            />
          </Field>
          <Field label="Bio" htmlFor="bio" hint="A few sentences about who you are and what drives you.">
            <Textarea id="bio" name="bio" rows={5} maxLength={2000} defaultValue={user.bio ?? ""} />
          </Field>
          <Button type="submit">Save profile</Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-1 font-display text-lg text-navy-950">Change password</h2>
        <p className="mb-4 text-sm text-navy-500">
          Choose something long and memorable — at least 10 characters.
        </p>
        <form action={changePassword} className="max-w-sm space-y-4">
          <Field label="Current password" htmlFor="currentPassword">
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
            />
          </Field>
          <Field label="New password" htmlFor="newPassword">
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
            />
          </Field>
          <Button type="submit" variant="outline">
            Change password
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-xs text-navy-400">
        Signed in as {user.email}. Your email address is your sign-in identity — contact
        the board if it needs updating.
      </p>
    </div>
  );
}
