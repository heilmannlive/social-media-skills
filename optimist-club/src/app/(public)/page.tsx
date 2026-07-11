import Link from "next/link";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "The Optimist Club — A private community for builders of Europe's future",
  description:
    "Europe does not lack intelligence. It lacks confidence. The Optimist Club convenes entrepreneurs, athletes, executives, and public leaders committed to restoring confidence, agency, and intellectual courage in Germany and Europe.",
};

/** Large decorative rising-sun motif for the hero. Purely ornamental. */
function SunriseMotif({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 320"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Rays */}
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M300 20v50" />
        <path d="M180 55l30 40" />
        <path d="M420 55l-30 40" />
        <path d="M90 130l48 24" />
        <path d="M510 130l-48 24" />
      </g>
      {/* Half sun */}
      <path d="M300 100a120 120 0 0 1 120 120H180a120 120 0 0 1 120-120Z" fill="currentColor" />
      {/* Horizon lines */}
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M60 250h480" />
        <path d="M130 285h340" />
        <path d="M210 318h180" />
      </g>
    </svg>
  );
}

const BELIEFS = [
  {
    title: "Constructive Optimism",
    body: "We believe optimism is not naivety — it is a discipline. Problems are assignments, not omens. We look at Europe's challenges soberly and choose, deliberately, to work on answers rather than rehearse complaints.",
  },
  {
    title: "Democratic Responsibility",
    body: "Free and open societies do not defend themselves. Those who have benefited most from Europe's freedoms — in business, sport, and public life — carry a special duty to strengthen the institutions that made their success possible.",
  },
  {
    title: "Intellectual Independence",
    body: "We think for ourselves. We follow evidence over fashion, argue in good faith, and welcome disagreement among people of goodwill. No party line is spoken here — only reasoned conviction, openly tested.",
  },
  {
    title: "European Confidence",
    body: "The continent that gave the world the Enlightenment, modern science, and the rule of law has not run out of ideas. Germany and Europe can lead again — if enough of us decide that leading is our job.",
  },
  {
    title: "Excellence and Action",
    body: "We hold ourselves to high standards and measure ourselves by what we build, not by what we say. Commentary is cheap; competence is rare. We prize doing hard things well — and finishing them.",
  },
];

const REJECTIONS = [
  "Cynicism disguised as realism",
  "Victimhood as political currency",
  "Extremism and dogmatism — of any direction",
  "The normalization of decline as destiny",
];

const CONVENED = [
  {
    title: "Entrepreneurs & builders",
    body: "Founders and operators who chose to build in Europe — and intend to keep building here.",
  },
  {
    title: "Athletes & high performers",
    body: "People who know what discipline, setbacks, and excellence actually cost — and what they return.",
  },
  {
    title: "Senior managers & executives",
    body: "Leaders responsible for teams, capital, and consequences across European industry.",
  },
  {
    title: "Public leaders & friends of Europe",
    body: "Politicians, scientists, and civic voices committed to open society and honest debate.",
  },
];

const MEMBERSHIP_STEPS = [
  {
    step: "01",
    title: "Apply or be invited",
    body: "Tell us who you are, what you have built, and why you are optimistic about Europe. An invitation code from a current member fast-tracks your application.",
  },
  {
    step: "02",
    title: "Board review",
    body: "Our board reviews every application personally. We look for integrity, contribution, and intellectual seriousness — not titles or follower counts.",
  },
  {
    step: "03",
    title: "Welcome",
    body: "Once admitted, you join a private directory of remarkable people, receive invitations to salons and roundtables across Europe, and take part in shaping the club.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <SunriseMotif className="pointer-events-none absolute -right-24 -top-10 hidden w-[560px] text-gold-500/15 lg:block" />
        <SunriseMotif className="pointer-events-none absolute -bottom-40 -left-32 w-[480px] rotate-180 text-navy-800/60" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-400">
            A private community for builders of Europe&rsquo;s future
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-4xl leading-tight sm:text-5xl md:text-6xl">
            Europe does not lack intelligence.{" "}
            <span className="text-gold-300">It lacks confidence.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-navy-200">
            The Optimist Club exists to restore confidence, agency, and
            intellectual courage in Germany and Europe — by convening the
            people willing to think, build, and lead.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <ButtonLink href="/join" variant="gold" className="px-6 py-3 text-base">
              Apply to join
            </ButtonLink>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md border border-navy-500 px-6 py-3 text-base font-semibold text-white transition-colors hover:border-gold-400 hover:text-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
            >
              Member sign in
            </Link>
          </div>
        </div>
      </section>

      {/* CHARTER */}
      <section id="charter" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">
            Our charter
          </p>
          <h2 className="mt-4 max-w-3xl font-display text-3xl text-navy-950 sm:text-4xl">
            Europe&rsquo;s future is not predetermined.
          </h2>
          <div className="mt-6 max-w-3xl space-y-4 text-lg leading-relaxed text-navy-700">
            <p>
              We believe in progress through reason, responsibility, and
              excellence. And we believe open societies do not run on autopilot:
              they need optimistic elites — people of proven ability and
              integrity — willing to think, build, and lead.
            </p>
            <p>
              This charter is our answer to a decade of decline narratives. It
              is short, demanding, and taken seriously.
            </p>
          </div>

          <h3 className="mt-16 font-display text-2xl text-navy-950">
            What we believe
          </h3>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BELIEFS.map((belief, i) => (
              <div
                key={belief.title}
                className="rounded-xl border border-navy-100 bg-white p-6 shadow-[0_1px_3px_rgba(10,22,40,0.06)]"
              >
                <p className="font-display text-sm text-gold-600">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h4 className="mt-2 font-display text-xl text-navy-950">
                  {belief.title}
                </h4>
                <p className="mt-3 text-sm leading-relaxed text-navy-600">
                  {belief.body}
                </p>
              </div>
            ))}
          </div>

          <h3 className="mt-16 font-display text-2xl text-navy-950">
            What we reject
          </h3>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {REJECTIONS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-lg border border-navy-100 bg-navy-50 px-4 py-3 text-sm font-medium text-navy-800"
              >
                <span aria-hidden="true" className="mt-0.5 text-gold-600">
                  ✕
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* WHO WE CONVENE */}
      <section className="border-y border-navy-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">
            Who we convene
          </p>
          <h2 className="mt-4 max-w-3xl font-display text-3xl text-navy-950 sm:text-4xl">
            A private, high-trust room for people who build.
          </h2>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-navy-700">
            Membership is based on integrity, contribution, and intellectual
            seriousness — not status, and not ideology. We ask for solutions
            over slogans and substance over spectacle, and we keep the room
            private so members can speak freely.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CONVENED.map((group) => (
              <div key={group.title} className="border-t-2 border-gold-500 pt-4">
                <h3 className="font-display text-lg text-navy-950">
                  {group.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-600">
                  {group.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MEMBERSHIP */}
      <section id="membership" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">
            Membership
          </p>
          <h2 className="mt-4 max-w-3xl font-display text-3xl text-navy-950 sm:text-4xl">
            How joining works
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {MEMBERSHIP_STEPS.map((step) => (
              <div
                key={step.step}
                className="rounded-xl border border-navy-100 bg-white p-6 shadow-[0_1px_3px_rgba(10,22,40,0.06)]"
              >
                <p className="font-display text-3xl text-gold-500">{step.step}</p>
                <h3 className="mt-3 font-display text-xl text-navy-950">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-navy-600">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-6 rounded-xl border border-gold-200 bg-gold-50 px-6 py-6 sm:px-8">
            <div>
              <p className="font-display text-lg text-navy-950">
                Annual dues: €240 per year
              </p>
              <p className="mt-1 max-w-xl text-sm text-navy-600">
                Dues keep the club independent — no sponsors, no advertisers,
                no outside agendas. They cover salons, operations, and nothing
                else.
              </p>
            </div>
            <ButtonLink href="/join" variant="gold" className="px-6 py-3 text-base">
              Apply to join
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* CLOSING BAND */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <SunriseMotif className="pointer-events-none absolute -bottom-32 left-1/2 w-[640px] -translate-x-1/2 text-gold-500/10" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-24">
          <p className="font-display text-2xl leading-relaxed text-navy-100 sm:text-3xl">
            &ldquo;Not to protest the world as it is — but to help shape what
            it can become.&rdquo;
          </p>
          <div className="mt-10">
            <ButtonLink href="/join" variant="gold" className="px-8 py-3 text-base">
              Apply to join
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
