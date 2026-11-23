import type { IpaSound } from "./ipa-sounds";

export interface PhonemeCandidate {
  phoneme: string;
  score: number;
}

export interface AssessedPhoneme {
  phoneme: string;
  accuracyScore: number;
  candidates: PhonemeCandidate[];
}

export interface AssessedWord {
  word: string;
  accuracyScore: number;
  errorType: string;
  phonemes: AssessedPhoneme[];
}

export interface PronunciationAssessment {
  recognitionStatus: "Recognized" | "NoSpeech";
  referenceText: string;
  recognizedText: string;
  accuracyScore: number;
  pronunciationScore: number;
  completenessScore: number;
  words: AssessedWord[];
}

export class InvalidAssessmentError extends Error {
  readonly code = "INVALID_RESPONSE";
  constructor() {
    super("Invalid pronunciation assessment data.");
    this.name = "InvalidAssessmentError";
  }
}

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function score(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new InvalidAssessmentError();
  return Math.min(100, Math.max(0, value));
}

function text(value: unknown, fallback?: string): string {
  if (typeof value === "string") return value;
  if (fallback !== undefined && (value === undefined || value === null))
    return fallback;
  throw new InvalidAssessmentError();
}

function list(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new InvalidAssessmentError();
  return value;
}

function parseCandidate(value: unknown): PhonemeCandidate {
  if (!isObject(value)) throw new InvalidAssessmentError();
  return { phoneme: text(value.phoneme), score: score(value.score) };
}

function parsePhoneme(value: unknown): AssessedPhoneme {
  if (!isObject(value)) throw new InvalidAssessmentError();
  return {
    phoneme: text(value.phoneme),
    accuracyScore: score(value.accuracyScore),
    candidates: list(value.candidates).map(parseCandidate),
  };
}

function parseWord(value: unknown): AssessedWord {
  if (!isObject(value)) throw new InvalidAssessmentError();
  return {
    word: text(value.word),
    accuracyScore: score(value.accuracyScore),
    errorType: text(value.errorType, "None"),
    phonemes: list(value.phonemes).map(parsePhoneme),
  };
}

/** Validates the backend body; throws `InvalidAssessmentError` on any mismatch. */
export function parseAssessment(value: unknown): PronunciationAssessment {
  if (!isObject(value)) throw new InvalidAssessmentError();
  const status = value.recognitionStatus;
  if (status !== "Recognized" && status !== "NoSpeech")
    throw new InvalidAssessmentError();
  return {
    recognitionStatus: status,
    referenceText: text(value.referenceText),
    recognizedText: text(value.recognizedText, ""),
    accuracyScore: score(value.accuracyScore),
    pronunciationScore: score(value.pronunciationScore),
    completenessScore: score(value.completenessScore),
    words: list(value.words).map(parseWord),
  };
}

export interface TargetScore {
  score: number;
  /** Indexes into the flat phoneme list that belong to the target sound. */
  indexes: number[];
  /** What the assessor heard instead, when a different phoneme ranked first. */
  heardInstead: string | null;
}

/** All phonemes of the assessed words, in order. */
export function flatPhonemes(assessment: PronunciationAssessment) {
  return assessment.words.flatMap((word) => word.phonemes);
}

function normalize(symbol: string) {
  // Azure writes /ɡ/ with the IPA letter; learners and data may use ASCII "g".
  return symbol.replace(/g/g, "ɡ").trim();
}

/**
 * Score of the sound being practised inside the example word. Multi-symbol
 * alternatives are averaged; when the sound occurs more than once, the weakest
 * occurrence counts. Returns `null` when the sound cannot be located.
 */
export function scoreTargetPhoneme(
  assessment: PronunciationAssessment,
  sound: Pick<IpaSound, "azurePhonemes">,
): TargetScore | null {
  const phonemes = flatPhonemes(assessment);
  const symbols = phonemes.map((item) => normalize(item.phoneme));
  let best: TargetScore | null = null;

  for (const alternative of sound.azurePhonemes) {
    const wanted = alternative.map(normalize);
    if (wanted.length === 0) continue;
    for (let start = 0; start + wanted.length <= symbols.length; start += 1) {
      if (!wanted.every((symbol, offset) => symbols[start + offset] === symbol))
        continue;
      const indexes = wanted.map((_, offset) => start + offset);
      const value =
        indexes.reduce((sum, index) => sum + phonemes[index].accuracyScore, 0) /
        indexes.length;
      if (!best || value < best.score) {
        best = { score: Math.round(value), indexes, heardInstead: null };
      }
    }
  }

  if (!best) return null;
  const first = phonemes[best.indexes[0]];
  const top = [...first.candidates].sort((a, b) => b.score - a.score)[0];
  if (top && normalize(top.phoneme) !== normalize(first.phoneme)) {
    best.heardInstead = top.phoneme;
  }
  return best;
}

export type ScoreBand = "good" | "fair" | "weak";

export function scoreBand(value: number): ScoreBand {
  if (value >= 80) return "good";
  if (value >= 60) return "fair";
  return "weak";
}

export const scoreBandLabels: Record<ScoreBand, string> = {
  good: "Good",
  fair: "Fair, almost there",
  weak: "Needs more practice",
};

/** True when the assessor recognised a different word from the one practised. */
export function heardDifferentWord(assessment: PronunciationAssessment) {
  const clean = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z' -]/g, "")
      .trim();
  const heard = clean(assessment.recognizedText);
  return heard !== "" && heard !== clean(assessment.referenceText);
}
