"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { mascotGuide, type MascotGuide } from "./mascot-tips";

const seenKey = "toeicmaster-mascot-seen";

/** Míc, the TOEICMaster fox with a headset. */
export function MascotFace({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 120 120">
      <path d="M26 56 16 12l38 18Z" fill="#e8641f" />
      <path d="m94 56 10-44-38 18Z" fill="#e8641f" />
      <path d="m30 44-6-22 20 10Z" fill="#fde2c7" />
      <path d="m90 44 6-22-20 10Z" fill="#fde2c7" />
      <path
        d="M20 56c0-22 20-30 40-30s40 8 40 30c0 26-24 50-40 54-16-4-40-28-40-54Z"
        fill="#f07a2b"
      />
      <path
        d="M60 110c-16-4-34-22-35-42 13-5 27 2 35 18 8-16 22-23 35-18-1 20-19 38-35 42Z"
        fill="#fff6ec"
      />
      <circle cx="44" cy="60" fill="#2b2724" r="6.5" />
      <circle cx="76" cy="60" fill="#2b2724" r="6.5" />
      <circle cx="46" cy="58" fill="#fff" r="2" />
      <circle cx="78" cy="58" fill="#fff" r="2" />
      <path d="M54 88h12l-6 7Z" fill="#2b2724" />
      <path
        d="M16 62C16 26 36 14 60 14s44 12 44 48"
        fill="none"
        stroke="#2b2724"
        strokeWidth="6"
      />
      <rect fill="#a21d1e" height="28" rx="6" width="13" x="9" y="52" />
      <rect fill="#a21d1e" height="28" rx="6" width="13" x="98" y="52" />
      <path
        d="M15 80c0 16 12 24 28 24"
        fill="none"
        stroke="#2b2724"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <circle cx="46" cy="104" fill="#a21d1e" r="5" />
    </svg>
  );
}

function GuideBubble({
  guide,
  onClose,
}: {
  guide: MascotGuide;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const last = step === guide.tips.length - 1;
  return (
    <section
      aria-label="Hướng dẫn sử dụng"
      className="w-[300px] rounded-xl border border-stone-300 bg-white p-4 text-stone-800 shadow-[0_12px_32px_-12px_rgb(62_44_30/35%)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold">{guide.title}</h2>
        <button
          aria-label="Đóng hướng dẫn"
          className="-mt-1 cursor-pointer px-1 text-lg leading-none text-stone-500 hover:text-stone-900"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </div>
      <p aria-live="polite" className="mt-2 text-sm leading-6">
        {guide.tips[step]}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-stone-500">
          {step + 1}/{guide.tips.length}
        </span>
        <button
          className="cursor-pointer rounded-lg bg-orange-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          onClick={() => (last ? onClose() : setStep(step + 1))}
          type="button"
        >
          {last ? "Đã hiểu" : "Tiếp"}
        </button>
      </div>
    </section>
  );
}

/** Corner helper explaining the current page; greets first-time visitors once. */
export function GuideMascot() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const guide = mascotGuide(pathname);

  useEffect(() => {
    const task = window.setTimeout(() => {
      try {
        if (window.localStorage.getItem(seenKey)) return;
        window.localStorage.setItem(seenKey, "1");
      } catch {
        return; // Storage blocked: stay quiet instead of greeting every page.
      }
      setOpen(true);
    }, 600);
    return () => window.clearTimeout(task);
  }, []);

  if (!guide) return null;
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <GuideBubble
          guide={guide}
          key={pathname}
          onClose={() => setOpen(false)}
        />
      )}
      <button
        aria-expanded={open}
        aria-label="Hỏi Míc cách sử dụng trang này"
        className="size-16 cursor-pointer rounded-full border border-stone-300 bg-white p-1.5 shadow-[0_8px_20px_-8px_rgb(62_44_30/40%)] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <MascotFace />
      </button>
    </div>
  );
}
