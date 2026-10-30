import { formatClock } from "@/shared/ui/format-time";

export type PhaseTone = "prepare" | "active" | "recording" | "idle";

const tones: Record<PhaseTone, { box: string; bar: string }> = {
  prepare: {
    box: "bg-amber-50 text-amber-800 ring-amber-200",
    bar: "bg-amber-500",
  },
  active: { box: "bg-red-50 text-red-700 ring-red-200", bar: "bg-red-500" },
  recording: {
    box: "bg-rose-50 text-rose-700 ring-rose-200",
    bar: "bg-rose-500",
  },
  idle: {
    box: "bg-slate-50 text-slate-600 ring-slate-200",
    bar: "bg-slate-400",
  },
};

/** Countdown for one attempt phase; `totalSeconds` adds a draining bar. */
export function PhaseTimer({
  label,
  seconds,
  tone,
  totalSeconds,
}: {
  label: string;
  seconds: number;
  tone: PhaseTone;
  totalSeconds?: number;
}) {
  const style = tones[tone];
  const ratio =
    totalSeconds && totalSeconds > 0
      ? Math.min(1, Math.max(0, seconds / totalSeconds))
      : null;
  return (
    <div
      aria-label={`${label}, còn ${formatClock(seconds)}`}
      className={`min-w-32 rounded-2xl px-4 py-2 text-right ring-1 ${style.box}`}
      role="timer"
    >
      <p className="flex items-center justify-end gap-1.5 text-xs font-bold uppercase tracking-wide">
        {tone === "recording" && (
          <span
            aria-hidden="true"
            className="size-2 animate-pulse rounded-full bg-rose-500"
          />
        )}
        {label}
      </p>
      <p className="text-2xl font-black tabular-nums">{formatClock(seconds)}</p>
      {ratio !== null && (
        <span
          aria-hidden="true"
          className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/80"
        >
          <span
            className={`block h-full rounded-full transition-[width] duration-1000 ease-linear ${style.bar}`}
            style={{ width: `${ratio * 100}%` }}
          />
        </span>
      )}
    </div>
  );
}
