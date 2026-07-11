import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { initials } from "@/lib/format";

// Small shared UI kit. Server-component friendly (no hooks, no state).

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const buttonVariants = {
  primary:
    "bg-navy-900 text-white hover:bg-navy-800 focus-visible:outline-navy-900 disabled:bg-navy-300",
  gold: "bg-gold-500 text-navy-950 hover:bg-gold-400 focus-visible:outline-gold-600 disabled:bg-gold-200",
  outline:
    "border border-navy-300 text-navy-900 hover:bg-navy-50 focus-visible:outline-navy-900 disabled:text-navy-300",
  danger: "bg-red-700 text-white hover:bg-red-600 focus-visible:outline-red-700 disabled:bg-red-300",
  ghost: "text-navy-700 hover:bg-navy-100 focus-visible:outline-navy-900",
} as const;

type ButtonVariant = keyof typeof buttonVariants;

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed";

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return (
    <button className={cx(buttonBase, buttonVariants[variant], className)} {...props} />
  );
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={cx(buttonBase, buttonVariants[variant], className)} {...props} />;
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-xl border border-navy-100 bg-white p-6 shadow-[0_1px_3px_rgba(10,22,40,0.06)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cx(
        "w-full rounded-md border border-navy-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-navy-300 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-100",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cx(
        "w-full rounded-md border border-navy-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-navy-300 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-100",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cx(
        "w-full rounded-md border border-navy-200 bg-white px-3 py-2 text-sm text-ink focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-100",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cx("mb-1 block text-sm font-medium text-navy-800", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="mt-1 text-xs text-navy-400">{hint}</p> : null}
    </div>
  );
}

const badgeTones = {
  navy: "bg-navy-100 text-navy-800",
  gold: "bg-gold-100 text-gold-800",
  green: "bg-emerald-100 text-emerald-800",
  red: "bg-red-100 text-red-800",
  gray: "bg-slate-100 text-slate-700",
} as const;

export function Badge({
  tone = "navy",
  children,
  className,
}: {
  tone?: keyof typeof badgeTones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        badgeTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Colored badge for a user role/status string. */
export function StatusBadge({ value }: { value: string }) {
  const tone =
    value === "ADMIN" || value === "BOARD"
      ? "gold"
      : value === "ACTIVE" || value === "MEMBER" || value === "PAID" || value === "GOING"
        ? "green"
        : value === "SUSPENDED" || value === "FAILED" || value === "DECLINED"
          ? "red"
          : "gray";
  return <Badge tone={tone}>{value}</Badge>;
}

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-16 w-16 text-xl" };
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-navy-800 font-semibold text-gold-300",
        sizes[size],
        className
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl text-navy-950">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-navy-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-2 py-12 text-center">
      <p className="font-display text-lg text-navy-800">{title}</p>
      {description ? <p className="max-w-md text-sm text-navy-500">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </Card>
  );
}
