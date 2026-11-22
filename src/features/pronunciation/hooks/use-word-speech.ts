"use client";

import { useCallback, useEffect, useState } from "react";

/** Reads example words aloud with the browser's built-in English voice. */
export function useWordSpeech() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const synth =
      typeof window === "undefined" ? undefined : window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") return;
    const check = () => {
      const voices = synth.getVoices();
      // Some browsers load voices late; an empty list still speaks with a default.
      setSupported(
        voices.length === 0 || voices.some((v) => v.lang.startsWith("en")),
      );
    };
    check();
    synth.addEventListener?.("voiceschanged", check);
    return () => {
      synth.removeEventListener?.("voiceschanged", check);
      synth.cancel();
    };
  }, []);

  const speak = useCallback((word: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    const voice = synth.getVoices().find((v) => v.lang === "en-US");
    if (voice) utterance.voice = voice;
    synth.speak(utterance);
  }, []);

  return { supported, speak };
}
