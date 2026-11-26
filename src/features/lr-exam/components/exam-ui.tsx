import Link from "next/link";
import type { ReactNode } from "react";
import type { LrPassage } from "../types";
import { UserMenu } from "@/features/user/components/user-menu";

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tm-ring)]";

export const primaryButton = `inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#c92e1c] to-[#e04810] px-5 text-[13px] font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

export const secondaryButton = `inline-flex h-11 items-center justify-center rounded-xl border border-[var(--tm-border-strong)] bg-[var(--tm-surface)] px-5 text-[13px] font-semibold text-[var(--tm-ink-soft)] transition hover:bg-[var(--tm-page)] ${focusRing}`;

type PillTone = "brand" | "success" | "danger" | "warning" | "muted";

const pillTones: Record<PillTone, string> = {
  brand: "bg-[var(--tm-brand-soft)] text-[var(--tm-brand)]",
  success: "bg-[var(--tm-success-soft)] text-[var(--tm-success)]",
  danger: "bg-[var(--tm-danger-soft)] text-[var(--tm-danger)]",
  warning: "bg-[var(--tm-warning-soft)] text-[var(--tm-warning)]",
  muted: "bg-[var(--tm-page)] text-[var(--tm-ink-muted)]",
};

export function Pill({
  children,
  tone = "brand",
}: {
  children: ReactNode;
  tone?: PillTone;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold ${pillTones[tone]}`}
    >
      {children}
    </span>
  );
}

export function ExamBrand() {
  return (
    <Link
      aria-label="TOEICMaster"
      className={`flex items-center gap-2.5 ${focusRing}`}
      href="/"
    >
      <span aria-hidden="true" className="flex items-start gap-[3px]">
        <span className="h-7 w-2 rounded-lg bg-[#ff9d00]" />
        <span className="h-7 w-2 rounded-lg bg-[var(--tm-brand-accent)]" />
        <span className="h-7 w-2 rounded-lg bg-[#be1718]" />
      </span>
      <span className="text-xl font-bold text-[var(--tm-ink)]">
        TOEICMaster
      </span>
    </Link>
  );
}

/** Learner navigation used by the instructions and score report screens. */
export function LearnerNav() {
  return (
    <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-x-8 gap-y-2 border-b border-[var(--tm-border)] bg-[var(--tm-surface)] px-4 py-2 sm:px-8">
      <ExamBrand />
      <nav
        aria-label="Main navigation"
        className="flex items-center gap-8 text-[13px]"
      >
        <Link
          className={`text-[var(--tm-ink-soft)] transition hover:text-[var(--tm-brand)] ${focusRing}`}
          href="/listening-reading"
        >
          Practice by Part
        </Link>
        <span
          aria-current="page"
          className="font-semibold text-[var(--tm-brand)]"
        >
          ETS Mock Tests
        </span>
      </nav>
      <UserMenu />
    </header>
  );
}

type IconName =
  | "list-checks"
  | "timer"
  | "headphones"
  | "trophy"
  | "square-check"
  | "file-question"
  | "close";

const iconPaths: Record<IconName, ReactNode> = {
  "list-checks": (
    <>
      <path d="m3 17 2 2 4-4" />
      <path d="m3 7 2 2 4-4" />
      <path d="M13 6h8M13 12h8M13 18h8" />
    </>
  ),
  timer: (
    <>
      <path d="M10 2h4" />
      <path d="M12 14l3-3" />
      <circle cx="12" cy="14" r="8" />
    </>
  ),
  headphones: (
    <>
      <path d="M3 14v-2a9 9 0 0 1 18 0v2" />
      <path d="M21 16a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 16a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </>
  ),
  trophy: (
    <>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16M10 14.7V17c0 .6-.5 1-1.1 1.2C7.8 18.7 7 20.2 7 22M14 14.7V17c0 .6.5 1 1.1 1.2 1.1.5 1.9 2 1.9 3.8" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0z" />
    </>
  ),
  "square-check": (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  "file-question": (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M10 10.3c.2-.8.9-1.3 1.7-1.3 1 0 1.8.7 1.8 1.6 0 1.2-1.5 1.4-1.5 2.4M12 17h.01" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
};

export function ExamIcon({
  name,
  className = "size-5",
  color = "var(--tm-brand)",
}: {
  name: IconName;
  className?: string;
  color?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {iconPaths[name]}
    </svg>
  );
}

export function PassageCard({ passage }: { passage: LrPassage }) {
  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-surface)] p-6 sm:p-8">
      <Pill>{passage.label}</Pill>
      <h2 className="text-lg font-semibold text-[var(--tm-ink)]">
        {passage.title}
      </h2>
      {passage.meta ? (
        <p className="text-[11px] whitespace-pre-wrap text-[var(--tm-ink-muted)]">
          {passage.meta}
        </p>
      ) : null}
      {passage.paragraphs.map((paragraph) =>
        paragraph.imageUrl ? (
          <div
            className="flex flex-col gap-2"
            key={paragraph.text || paragraph.imageUrl}
          >
            {paragraph.text ? (
              <p className="text-[15px]">{paragraph.text}</p>
            ) : null}
            {/* eslint-disable-next-line @next/next/no-img-element -- Presigned MinIO/S3 exam media has dynamic origins and unknown intrinsic dimensions. */}
            <img
              alt="Reading passage illustration"
              className="max-h-[420px] w-auto max-w-full rounded-lg object-contain"
              src={paragraph.imageUrl}
            />
          </div>
        ) : paragraph.evidence ? (
          <p
            className="rounded-lg border border-[var(--tm-brand)] bg-[#fef08a] p-3 text-[15px] text-[var(--tm-ink)]"
            key={paragraph.text}
          >
            <mark className="bg-transparent text-[var(--tm-ink)]">
              {paragraph.text}
            </mark>
          </p>
        ) : (
          <p className="text-[15px]" key={paragraph.text}>
            {paragraph.text}
          </p>
        ),
      )}
      {passage.signature ? (
        <p className="text-[15px]">
          {passage.signature.map((line, index) => (
            <span className="block" key={index}>
              {line}
            </span>
          ))}
        </p>
      ) : null}
    </article>
  );
}
