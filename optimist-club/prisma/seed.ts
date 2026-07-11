/* Seed data for local development and demos.
 * Run with: npm run db:seed
 *
 * Accounts (password for all: `optimist2026`):
 *   admin@optimists-club.com  — ADMIN
 *   board@optimists-club.com  — BOARD
 *   member@optimists-club.com — MEMBER
 *   applicant@optimists-club.com — PENDING application
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("optimist2026", 12);
  const year = new Date().getFullYear();

  const admin = await db.user.upsert({
    where: { email: "admin@optimists-club.com" },
    update: {},
    create: {
      email: "admin@optimists-club.com",
      passwordHash,
      name: "Alexandra Weber",
      role: "ADMIN",
      status: "ACTIVE",
      title: "Club Director",
      organization: "The Optimist Club",
      city: "Berlin",
      country: "Germany",
      bio: "Founding director. Building a community of builders, thinkers, and doers for Europe's next chapter.",
      expertise: "Community, Strategy, Public Affairs",
      memberSince: new Date(`${year - 1}-01-15`),
    },
  });

  const board = await db.user.upsert({
    where: { email: "board@optimists-club.com" },
    update: {},
    create: {
      email: "board@optimists-club.com",
      passwordHash,
      name: "Markus Lindqvist",
      role: "BOARD",
      status: "ACTIVE",
      title: "Managing Partner",
      organization: "Nordstern Ventures",
      city: "Munich",
      country: "Germany",
      bio: "Investor in European deep tech. Convinced the next great companies will be built here.",
      expertise: "Venture Capital, Deep Tech, Energy",
      memberSince: new Date(`${year - 1}-02-01`),
    },
  });

  const member = await db.user.upsert({
    where: { email: "member@optimists-club.com" },
    update: {},
    create: {
      email: "member@optimists-club.com",
      passwordHash,
      name: "Sofia Marchetti",
      role: "MEMBER",
      status: "ACTIVE",
      title: "Olympic Athlete & Founder",
      organization: "Marchetti Performance",
      city: "Milan",
      country: "Italy",
      bio: "Two-time Olympian. Now building performance programs for European leadership teams.",
      expertise: "High Performance, Sports, Leadership",
      memberSince: new Date(`${year}-01-10`),
    },
  });

  await db.user.upsert({
    where: { email: "applicant@optimists-club.com" },
    update: {},
    create: {
      email: "applicant@optimists-club.com",
      passwordHash,
      name: "Jonas Keller",
      role: "PENDING",
      status: "PENDING",
      title: "Head of Product",
      organization: "Keller Industries",
      city: "Zurich",
      country: "Switzerland",
      bio: "Applying because I'm tired of decline narratives and want to help build.",
      expertise: "Product, Manufacturing",
    },
  });

  const invite = await db.inviteCode.upsert({
    where: { code: "EUROPE-2026" },
    update: {},
    create: {
      code: "EUROPE-2026",
      role: "MEMBER",
      maxUses: 25,
      createdById: admin.id,
    },
  });

  const inTwoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const inFiveWeeks = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000);

  const salon = await db.event.create({
    data: {
      title: "Berlin Salon: Europe's Energy Renaissance",
      description:
        "An evening with founders and policymakers on how Europe can build abundant, clean, and sovereign energy. Off the record, on the future. Dinner follows the discussion.",
      location: "Soho House Berlin, Torstraße 1",
      city: "Berlin",
      startsAt: inTwoWeeks,
      capacity: 40,
      isPublished: true,
      createdById: admin.id,
    },
  });

  await db.event.create({
    data: {
      title: "Munich Roundtable: Building in Europe, Staying in Europe",
      description:
        "A working session with founders who chose to scale from Europe. What worked, what has to change, and what we do about it.",
      location: "Literaturhaus München, Salvatorplatz 1",
      city: "Munich",
      startsAt: inFiveWeeks,
      capacity: 25,
      isPublished: true,
      createdById: board.id,
    },
  });

  await db.rsvp.upsert({
    where: { userId_eventId: { userId: member.id, eventId: salon.id } },
    update: {},
    create: { userId: member.id, eventId: salon.id, status: "GOING" },
  });

  await db.announcement.create({
    data: {
      title: "Welcome to the member area",
      body: "This is the digital home of The Optimist Club. Find upcoming salons under Events, meet fellow members in the directory, and keep your profile current — it is how members find each other. Berlin salon RSVPs close Friday.",
      audience: "ALL",
      pinned: true,
      authorId: admin.id,
    },
  });

  await db.payment.upsert({
    where: { userId_periodYear: { userId: member.id, periodYear: year } },
    update: {},
    create: {
      userId: member.id,
      amountCents: 24000,
      currency: "eur",
      periodYear: year,
      status: "PAID",
      method: "TRANSFER",
      paidAt: new Date(),
      note: "Seed: dues settled by bank transfer",
    },
  });

  console.log("Seed complete:", {
    users: 4,
    invite: invite.code,
    password: "optimist2026",
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
