import Link from "next/link";
import { primaryAction } from "./styles";

export function TestCard({
  code,
  title,
  description,
  stats,
  href,
  actionLabel,
}: {
  code: string;
  title: string;
  description: string;
  stats: { label: string; value: string }[];
  href: string;
  actionLabel: string;
}) {
  return (
    <article className="flex min-h-64 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:shadow-md">
      <span className="w-fit rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold tracking-[0.1em] text-orange-700">
        {code}
      </span>
      <h3 className="mt-3 text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <dl className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-stone-50 p-3 text-xs">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-slate-500">{stat.label}</dt>
            <dd className="mt-1 font-bold text-slate-900">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-auto pt-5">
        <Link className={`w-full ${primaryAction}`} href={href}>
          {actionLabel}
        </Link>
      </div>
    </article>
  );
}
