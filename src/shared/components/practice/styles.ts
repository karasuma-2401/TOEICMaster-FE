// Class tokens shared by the learner-facing practice screens (Writing, Speaking).

/** One horizontal frame for the header and every practice page, so edges line up. */
export const pageContainer =
  "mx-auto w-full max-w-[1440px] px-4 md:px-8 xl:px-12";

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600";

export const primaryAction = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-5 text-sm font-bold text-white shadow-[0_8px_20px_-10px_rgb(234_88_12/0.7)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const secondaryAction = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const textLink = `text-sm font-bold text-orange-700 underline decoration-2 underline-offset-4 hover:text-orange-800 ${focusRing}`;

export const surfaceCard =
  "rounded-3xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04),0_12px_32px_-18px_rgb(15_23_42/0.18)]";

export const insetPanel = "rounded-2xl border border-slate-200 bg-slate-50/70";

export const eyebrow =
  "text-xs font-extrabold tracking-[0.14em] text-orange-600";
