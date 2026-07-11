import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { Avatar, Badge, Card, PageHeader } from "@/components/ui";

function expertiseTags(expertise: string | null): string[] {
  if (!expertise) return [];
  return expertise
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("MEMBER");
  const { id } = await params;

  const member = await db.user.findUnique({ where: { id } });
  if (
    !member ||
    member.status !== "ACTIVE" ||
    !["MEMBER", "BOARD", "ADMIN"].includes(member.role)
  ) {
    notFound();
  }

  const tags = expertiseTags(member.expertise);
  const position = [member.title, member.organization].filter(Boolean).join(" @ ");
  const place = [member.city, member.country].filter(Boolean).join(", ");

  return (
    <div>
      <PageHeader
        title={member.name}
        subtitle={position || undefined}
        actions={
          <Link
            href="/members"
            className="text-sm font-semibold text-navy-700 hover:text-navy-950 hover:underline"
          >
            ← Back to directory
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-start gap-4">
            <Avatar name={member.name} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl text-navy-950">{member.name}</h2>
                {member.role === "BOARD" || member.role === "ADMIN" ? (
                  <Badge tone="gold">{member.role === "ADMIN" ? "Admin" : "Board"}</Badge>
                ) : null}
              </div>
              {position ? <p className="mt-1 text-sm text-navy-600">{position}</p> : null}
              {place ? <p className="mt-0.5 text-sm text-navy-400">{place}</p> : null}
            </div>
          </div>

          {member.bio ? (
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-400">
                About
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-navy-800">
                {member.bio}
              </p>
            </div>
          ) : (
            <p className="mt-6 text-sm italic text-navy-400">
              {member.name.split(" ")[0]} hasn&rsquo;t written a bio yet.
            </p>
          )}

          {tags.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-400">
                Expertise
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <Badge key={t} tone="navy">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        <Card>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-400">
            Contact
          </h3>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="font-medium text-navy-500">Email</dt>
              <dd>
                <a
                  href={`mailto:${member.email}`}
                  className="break-all text-navy-900 hover:underline"
                >
                  {member.email}
                </a>
              </dd>
            </div>
            {member.phone ? (
              <div>
                <dt className="font-medium text-navy-500">Phone</dt>
                <dd>
                  <a href={`tel:${member.phone}`} className="text-navy-900 hover:underline">
                    {member.phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {member.linkedinUrl ? (
              <div>
                <dt className="font-medium text-navy-500">LinkedIn</dt>
                <dd>
                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-navy-900 hover:underline"
                  >
                    {member.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "")}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>

          <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-navy-400">
            Membership
          </h3>
          <p className="mt-2 text-sm text-navy-800">
            Member since {member.memberSince ? formatDate(member.memberSince) : formatDate(member.createdAt)}
          </p>
        </Card>
      </div>
    </div>
  );
}
