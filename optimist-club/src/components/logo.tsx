/**
 * Brand mark for The Optimists Club: three forward-leaning "leaves" (open
 * rounded strokes) that read as motion and optimism, matching the primary
 * logo. `tone` controls the stroke color so it works on light and dark.
 */
export function Leaves({
  className = "h-7 w-7",
  tone = "currentColor",
}: {
  className?: string;
  tone?: string;
}) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <g
        stroke={tone}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Three nested hooks, each offset to the right, leaning forward. */}
        <path d="M14 50V22a10 10 0 0 1 10-10" />
        <path d="M25 50V22a10 10 0 0 1 10-10" />
        <path d="M36 50V22a10 10 0 0 1 10-10" />
      </g>
    </svg>
  );
}

/**
 * Full logo lockup: the leaves mark beside the stacked "THE / optimists /
 * CLUB" wordmark. On dark surfaces pass `light`.
 */
export function Wordmark({ light = false }: { light?: boolean }) {
  const primary = light ? "text-white" : "text-navy-600";
  const secondary = light ? "text-navy-200" : "text-navy-950";
  return (
    <span className="inline-flex items-center gap-2.5">
      <Leaves className={`h-8 w-8 ${light ? "text-navy-300" : "text-navy-600"}`} />
      <span className="leading-[0.95]">
        <span
          className={`block text-[0.6rem] font-bold uppercase tracking-[0.35em] ${secondary}`}
        >
          The
        </span>
        <span className={`block text-lg font-extrabold lowercase tracking-tight ${primary}`}>
          optimists
        </span>
        <span
          className={`block text-xs font-bold uppercase tracking-[0.3em] ${secondary}`}
        >
          Club
        </span>
      </span>
    </span>
  );
}

/**
 * Compact single-line wordmark for tight spaces (e.g. mobile headers).
 */
export function WordmarkInline({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Leaves className={`h-6 w-6 ${light ? "text-navy-300" : "text-navy-600"}`} />
      <span
        className={`font-extrabold tracking-tight ${light ? "text-white" : "text-navy-950"}`}
      >
        The <span className="lowercase text-navy-600">optimists</span> Club
      </span>
    </span>
  );
}

// Back-compat: some pages import `Sunrise`. Alias it to the new mark so those
// references keep working with the brand logo.
export const Sunrise = Leaves;
