"use client";

import Link from "next/link";

const button =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 text-[13px] font-medium whitespace-nowrap text-stone-700 transition hover:border-orange-500 hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600";

function goBack() {
  // A page opened directly has nothing to go back to.
  if (window.history.length > 1) window.history.back();
  else window.location.assign("/");
}

/** Lets learners move around without editing the address bar. */
export function PageNavButtons() {
  return (
    <div className="flex items-center gap-2">
      <button className={button} onClick={goBack} type="button">
        <span aria-hidden="true">←</span> Quay lại
      </button>
      <Link className={button} href="/">
        <svg
          aria-hidden="true"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          viewBox="0 0 24 24"
        >
          <path d="m3 10.5 9-7.5 9 7.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-9.5Z" />
        </svg>
        Trang chủ
      </Link>
    </div>
  );
}
