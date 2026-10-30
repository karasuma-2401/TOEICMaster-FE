import Link from "next/link";
import { focusRing } from "./styles";

export function PartCard({
  eyebrow,
  part,
  title,
  description,
  meta,
  href,
  actionLabel,
  unavailableLabel,
}: {
  eyebrow: string;
  part: number;
  title: string;
  description: string;
  meta?: string;
  href?: string;
  actionLabel: string;
  unavailableLabel: string;
}) {
  return (
    <article className="group relative flex flex-col rounded-3xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold tracking-[0.12em] text-orange-600">
          {eyebrow}
        </p>
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-50 to-amber-100 text-sm font-black text-orange-700"
        >
          {part}
        </span>
      </div>
      <h3 className="mt-2 text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      {meta && (
        <p className="mt-3 text-xs font-semibold text-slate-500">{meta}</p>
      )}
      <div className="mt-auto pt-5">
        {href ? (
          <Link
            className={`inline-flex items-center gap-1 text-sm font-bold text-orange-700 underline decoration-2 underline-offset-4 ${focusRing}`}
            href={href}
          >
            {actionLabel}
          </Link>
        ) : (
          <p className="text-sm font-semibold text-slate-400">
            {unavailableLabel}
          </p>
        )}
      </div>
    </article>
  );
}
