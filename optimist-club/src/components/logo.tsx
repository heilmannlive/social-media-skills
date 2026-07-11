export function Sunrise({ className = "h-6 w-6" }: { className?: string }) {
  // Rising-sun mark: half sun over a horizon line.
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 5.5a6.5 6.5 0 0 1 6.5 6.5h-13A6.5 6.5 0 0 1 12 5.5Z" fill="currentColor" />
      <path
        d="M2 15h20M5 18.5h14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 1.5v2M4.6 4.6l1.4 1.4M19.4 4.6 18 6M1.5 12h2M20.5 12h2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Sunrise className={`h-6 w-6 ${light ? "text-gold-400" : "text-gold-600"}`} />
      <span
        className={`font-display text-lg font-semibold tracking-wide ${
          light ? "text-white" : "text-navy-950"
        }`}
      >
        The Optimist Club
      </span>
    </span>
  );
}
