"use client";

import { useCallback, useEffect, useState } from "react";

/** Reads English text with the browser's voice; `supported` is false without one. */
export function useSpeechPlayback(text: string) {
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

  const toggle = useCallback(() => {
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [speaking, text]);

  return { supported, speaking, toggle };
}
