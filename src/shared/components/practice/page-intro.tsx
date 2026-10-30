import Link from "next/link";
import type { ReactNode } from "react";
import { eyebrow as eyebrowClass, focusRing } from "./styles";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 ${focusRing}`}
      href={href}
    >
      <span aria-hidden="true">←</span>
      {label}
    </Link>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-3xl">
        <p className={eyebrowClass}>{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 leading-7 text-slate-600">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function SectionHeading({
  id,
  title,
  description,
  aside,
}: {
  id: string;
  title: string;
  description?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900" id={id}>
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {aside}
    </div>
  );
}

export function CountBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700 ring-1 ring-orange-100">
      {children}
    </span>
  );
}
