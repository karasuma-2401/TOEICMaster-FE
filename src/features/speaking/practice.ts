import { speakingParts, type SpeakingMode, type SpeakingPart } from "./types";

export function modeFromRoute(value: string | undefined): SpeakingMode {
  const match = /^part-([1-5])$/.exec(value ?? "");
  return match ? (`PART_${match[1]}` as SpeakingMode) : "FULL";
}

export function routeFromMode(mode: SpeakingMode) {
  return mode === "FULL" ? "full" : `part-${mode.slice(5)}`;
}

export function partFromMode(mode: SpeakingMode): SpeakingPart | null {
  return mode === "FULL" ? null : (Number(mode.slice(5)) as SpeakingPart);
}

export function displaySpeakingMode(mode: SpeakingMode) {
  const part = partFromMode(mode);
  return part ? `Luyện Part ${part}` : "Full Test";
}

export function modeParts(mode: SpeakingMode): SpeakingPart[] {
  const part = partFromMode(mode);
  return part ? [part] : [...speakingParts];
}
