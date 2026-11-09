import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { BrandMark } from "@/features/user/components/brand-mark";
import { CheckIcon } from "./icons";

export type ChipTone =
  "orange" | "success" | "warning" | "danger" | "speak" | "neutral";

export function Chip({
  tone,
  className = "",
  children,
}: {
  tone: ChipTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`sp-chip sp-chip-${tone} ${className}`}>{children}</span>
  );
}

/** Logo mark plus the wordmark. */
export function SpeakingLogo({ href = "/" }: { href?: string }) {
  return (
    <Link
      className="sp-focus flex items-center gap-2.5 text-[22px] font-bold leading-none"
      href={href}
    >
      <BrandMark />
      TOEICMaster
    </Link>
  );
}

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Đường dẫn" className="text-[13px] text-(--sp-ink-3)">
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 && " / "}
          {item.href ? (
            <Link className="sp-focus hover:text-(--sp-brand)" href={item.href}>
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

export function ProgressBar({
  value,
  label,
}: {
  /** 0 to 1. */
  value: number;
  label?: string;
}) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <>
      <progress
        aria-label={label}
        className="sr-only"
        max={100}
        value={percent}
      />
      <div
        aria-hidden="true"
        className="h-1.5 overflow-hidden rounded-full bg-(--sp-track)"
      >
        <div
          className="h-full rounded-full bg-(--sp-brand) transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </>
  );
}

const waveHeights = [30, 60, 42, 85, 55, 100, 38, 72, 48, 92, 34, 66];

/**
 * Bar waveform. `level` (0–1) drives live microphone input; without it the
 * bars follow a fixed pattern, and `animated` makes them pulse.
 */
export function Waveform({
  bars = 44,
  progress = 1,
  animated = false,
  level,
  className = "text-(--sp-brand)",
  height = 56,
}: {
  bars?: number;
  progress?: number;
  animated?: boolean;
  level?: number;
  className?: string;
  height?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center gap-1 overflow-hidden ${animated ? "sp-wave-live" : ""} ${className}`}
      style={{ height }}
    >
      {Array.from({ length: bars }, (_, index) => {
        const base = waveHeights[index % waveHeights.length];
        const scaled =
          level === undefined ? base : Math.max(10, base * Math.min(1, level));
        return (
          <span
            className="sp-wave-bar"
            key={index}
            style={{
              height: `${scaled}%`,
              opacity: index / bars < progress ? 1 : 0.3,
              animationDelay: animated ? `${(index % 7) * 90}ms` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

export function GradingStepper({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Xác nhận đồng ý", "AI chấm bài", "Xem kết quả"];
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
      {steps.map((label, index) => {
        const number = index + 1;
        const done = number < current;
        const active = number === current;
        return (
          <li className="flex items-center gap-3" key={label}>
            {index > 0 && (
              <span aria-hidden="true" className="h-px w-10 bg-(--sp-line)" />
            )}
            <span
              aria-current={active ? "step" : undefined}
              className={`inline-flex items-center gap-1.5 ${done ? "text-(--sp-success)" : active ? "font-semibold text-(--sp-brand)" : "text-(--sp-ink-2)"}`}
            >
              {done ? <CheckIcon size={14} /> : <span>{number}</span>}
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function SpLoading({ label }: { label: string }) {
  return (
    <output className="sp-card block p-10 text-center text-(--sp-ink-2)">
      {label}
    </output>
  );
}

export function SpError({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry?: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-(--sp-danger-line) bg-(--sp-danger-bg) p-5 text-sm text-(--sp-danger)"
      role="alert"
    >
      <p className="font-semibold">{message}</p>
      {onRetry && (
        <button
          className="sp-btn sp-btn-sm sp-btn-outline mt-3"
          onClick={onRetry}
          type="button"
        >
          Thử tải lại
        </button>
      )}
    </div>
  );
}

export function SpEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="sp-card p-10 text-center">
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-1 text-[13px] text-(--sp-ink-2)">{description}</p>
    </div>
  );
}
