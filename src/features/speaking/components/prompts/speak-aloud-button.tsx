"use client";

import { useEffect, useState } from "react";
import { focusRing } from "@/shared/components/practice/styles";

/** Reads English text aloud with the browser voice; hidden when unsupported. */
export function SpeakAloudButton({
  text,
  label = "Nghe câu hỏi",
}: {
  text: string;
  label?: string;
}) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    const task = window.setTimeout(
      () => setSupported("speechSynthesis" in window),
      0,
    );
    return () => {
      window.clearTimeout(task);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);
  if (!supported) return null;
  const play = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };
  return (
    <button
      aria-pressed={speaking}
      className={`inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-orange-700 ring-1 ring-orange-200 transition hover:bg-orange-50 ${focusRing}`}
      onClick={play}
      type="button"
    >
      <span aria-hidden="true">{speaking ? "◼" : "▶"}</span>
      {speaking ? "Đang phát…" : label}
    </button>
  );
}
