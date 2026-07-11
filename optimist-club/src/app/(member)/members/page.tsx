import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
} from "@/components/ui";

export const metadata = { title: "Members — The Optimist Club" };

function expertiseTags(expertise: string | null): string[] {
  if (!expertise) return [];
  return expertise
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole("MEMBER");
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const members = await db.user.findMany({
    where: {
      status: "ACTIVE",
      role: { in: ["MEMBER", "BOARD", "ADMIN"] },
      ...(query
        ? {
            OR: [
              { name: { contains: query } },
              { organization: { contains: query } },
              { city: { contains: query } },
              { country: { contains: query } },
              { expertise: { contains: query } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Members"
        subtitle="The people who make this club worth belonging to."
      />

      <form method="GET" action="/members" className="mb-6 flex max-w-lg gap-2">
        <Input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search by name, organization, city, country, or expertise"
          aria-label="Search members"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {members.length === 0 ? (
        query ? (
          <EmptyState
            title="No members match your search"
            description={`Nothing turned up for “${query}”. Try a broader term — a country, a field of expertise, or part of a name.`}
          />
        ) : (
          <EmptyState
            title="The directory is just getting started"
            description="Approved members will appear here as the club grows."
          />
        )
      ) : (
        <>
          <p className="mb-4 text-sm text-navy-500">
            {members.length} {members.length === 1 ? "member" : "members"}
            {query ? ` matching “${query}”` : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => {
              const tags = expertiseTags(m.expertise);
              const position = [m.title, m.organization].filter(Boolean).join(" @ ");
              const place = [m.city, m.country].filter(Boolean).join(", ");
              return (
                <Link key={m.id} href={`/members/${m.id}`} className="group">
                  <Card className="h-full transition-colors group-hover:border-navy-300">
                    <div className="flex items-start gap-3">
                      <Avatar name={m.name} />
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 font-semibold text-navy-950">
                          <span className="truncate">{m.name}</span>
                          {m.role === "BOARD" || m.role === "ADMIN" ? (
                            <Badge tone="gold">{m.role === "ADMIN" ? "Admin" : "Board"}</Badge>
                          ) : null}
                        </p>
                        {position ? (
                          <p className="mt-0.5 truncate text-sm text-navy-600">{position}</p>
                        ) : null}
                        {place ? (
                          <p className="mt-0.5 text-xs text-navy-400">{place}</p>
                        ) : null}
                      </div>
                    </div>
                    {tags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {tags.slice(0, 4).map((t) => (
                          <Badge key={t} tone="navy">
                            {t}
                          </Badge>
                        ))}
                        {tags.length > 4 ? (
                          <Badge tone="gray">+{tags.length - 4}</Badge>
                        ) : null}
                      </div>
                    ) : null}
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
