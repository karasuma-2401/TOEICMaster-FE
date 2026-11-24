import { HttpError, requestJson, requestVoid } from "@/shared/api/http";
import type {
  CardMastery,
  CardProgressRecord,
  CefrLevel,
  FlashcardCategory,
  FlashcardDeck,
  FlashcardItem,
  MatchRecord,
} from "./types";

export interface FlashcardWorkspaceApiResponse {
  decks: FlashcardDeck[];
  progress: Record<string, CardProgressRecord>;
  matchRecords: Record<string, MatchRecord>;
}

export interface CreateFlashcardCardPayload {
  term: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaningVi: string;
  exampleEn?: string;
  exampleVi?: string;
  collocations?: string[];
  toeicPart?: string;
  level?: CefrLevel;
}

export interface CreateFlashcardDeckPayload {
  title: string;
  description: string;
  cards: CreateFlashcardCardPayload[];
}

export class FlashcardsApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "FlashcardsApiError";
    this.status = status;
  }
}

const VALID_CATEGORIES = new Set<FlashcardCategory>([
  "office",
  "contracts",
  "finance",
  "travel",
  "marketing",
  "hr",
  "custom",
]);

const VALID_MASTERY = new Set<CardMastery>([
  "new",
  "learning",
  "review",
  "mastered",
]);

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isServerGuid(id: string): boolean {
  return GUID_REGEX.test(id);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseCard(raw: unknown): FlashcardItem {
  if (!isRecord(raw)) {
    throw new Error("Invalid flashcard card payload.");
  }
  if (
    typeof raw.id !== "string" ||
    typeof raw.term !== "string" ||
    typeof raw.meaningVi !== "string"
  ) {
    throw new Error("Missing required fields in flashcard card.");
  }

  const level: CefrLevel =
    raw.level === "B1" || raw.level === "B2" || raw.level === "C1"
      ? raw.level
      : "B2";

  return {
    id: raw.id,
    term: raw.term,
    phonetic: typeof raw.phonetic === "string" ? raw.phonetic : "",
    partOfSpeech:
      typeof raw.partOfSpeech === "string" ? raw.partOfSpeech : "noun",
    meaningVi: raw.meaningVi,
    exampleEn: typeof raw.exampleEn === "string" ? raw.exampleEn : "",
    exampleVi: typeof raw.exampleVi === "string" ? raw.exampleVi : "",
    collocations: Array.isArray(raw.collocations)
      ? raw.collocations.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    toeicPart:
      typeof raw.toeicPart === "string" ? raw.toeicPart : "TOEIC Vocab",
    level,
  };
}

export function parseDeck(raw: unknown): FlashcardDeck {
  if (!isRecord(raw)) {
    throw new Error("Invalid flashcard deck payload.");
  }
  if (
    typeof raw.id !== "string" ||
    typeof raw.slug !== "string" ||
    typeof raw.title !== "string" ||
    !Array.isArray(raw.cards)
  ) {
    throw new Error("Missing required fields in flashcard deck.");
  }

  const category: FlashcardCategory =
    typeof raw.category === "string" &&
    VALID_CATEGORIES.has(raw.category as FlashcardCategory)
      ? (raw.category as FlashcardCategory)
      : "custom";

  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    description: typeof raw.description === "string" ? raw.description : "",
    category,
    targetScore:
      typeof raw.targetScore === "string" ? raw.targetScore : "TOEIC",
    estimatedMinutes:
      typeof raw.estimatedMinutes === "number" && raw.estimatedMinutes > 0
        ? raw.estimatedMinutes
        : Math.max(2, Math.ceil(raw.cards.length * 0.8)),
    isCustom: Boolean(raw.isCustom),
    cards: raw.cards.map(parseCard),
  };
}

export function parseProgress(raw: unknown): CardProgressRecord {
  if (!isRecord(raw)) {
    throw new Error("Invalid flashcard progress payload.");
  }
  const status: CardMastery =
    typeof raw.status === "string" &&
    VALID_MASTERY.has(raw.status as CardMastery)
      ? (raw.status as CardMastery)
      : "new";

  return {
    status,
    starred: Boolean(raw.starred),
    reviewCount:
      typeof raw.reviewCount === "number" && raw.reviewCount >= 0
        ? raw.reviewCount
        : 0,
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : new Date().toISOString(),
  };
}

export function parseMatchRecord(raw: unknown): MatchRecord {
  if (!isRecord(raw)) {
    throw new Error("Invalid flashcard match record payload.");
  }
  if (typeof raw.bestTimeMs !== "number" || raw.bestTimeMs <= 0) {
    throw new Error("Invalid bestTimeMs in match record.");
  }
  return {
    bestTimeMs: raw.bestTimeMs,
    bestCombo:
      typeof raw.bestCombo === "number" && raw.bestCombo >= 0
        ? raw.bestCombo
        : 0,
    playCount:
      typeof raw.playCount === "number" && raw.playCount > 0
        ? raw.playCount
        : 1,
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : new Date().toISOString(),
    isNewRecord:
      typeof raw.isNewRecord === "boolean" ? raw.isNewRecord : undefined,
  };
}

export function parseWorkspace(raw: unknown): FlashcardWorkspaceApiResponse {
  if (!isRecord(raw) || !Array.isArray(raw.decks)) {
    throw new Error("Invalid flashcard workspace payload.");
  }

  const progress: Record<string, CardProgressRecord> = {};
  if (isRecord(raw.progress)) {
    for (const [cardId, entry] of Object.entries(raw.progress)) {
      progress[cardId] = parseProgress(entry);
    }
  }

  const matchRecords: Record<string, MatchRecord> = {};
  if (isRecord(raw.matchRecords)) {
    for (const [deckId, entry] of Object.entries(raw.matchRecords)) {
      matchRecords[deckId] = parseMatchRecord(entry);
    }
  }

  return {
    decks: raw.decks.map(parseDeck),
    progress,
    matchRecords,
  };
}

function toFlashcardsError(cause: unknown): never {
  if (cause instanceof FlashcardsApiError) throw cause;
  if (cause instanceof HttpError) {
    const message = cause.detail ?? cause.title ?? cause.message;
    throw new FlashcardsApiError(cause.status, message);
  }
  if (cause instanceof Error) {
    throw new FlashcardsApiError(502, cause.message);
  }
  throw new FlashcardsApiError(502, "Unable to connect to Flashcards service.");
}

export async function getFlashcardWorkspace(
  signal?: AbortSignal,
): Promise<FlashcardWorkspaceApiResponse> {
  try {
    return await requestJson("/api/flashcards/decks", {
      method: "GET",
      signal,
      parse: parseWorkspace,
      fallbackMessage: "Unable to load flashcards.",
    });
  } catch (cause) {
    toFlashcardsError(cause);
  }
}

export async function createFlashcardDeckApi(
  payload: CreateFlashcardDeckPayload,
): Promise<FlashcardDeck> {
  try {
    return await requestJson("/api/flashcards/decks", {
      method: "POST",
      json: payload,
      parse: parseDeck,
      fallbackMessage: "Unable to create flashcard deck.",
    });
  } catch (cause) {
    toFlashcardsError(cause);
  }
}

export async function addFlashcardCardApi(
  deckId: string,
  payload: CreateFlashcardCardPayload,
): Promise<FlashcardItem> {
  try {
    return await requestJson(`/api/flashcards/decks/${deckId}/cards`, {
      method: "POST",
      json: payload,
      parse: parseCard,
      fallbackMessage: "Unable to add word to the deck.",
    });
  } catch (cause) {
    toFlashcardsError(cause);
  }
}

export async function deleteFlashcardDeckApi(deckId: string): Promise<void> {
  try {
    await requestVoid(`/api/flashcards/decks/${deckId}`, {
      method: "DELETE",
      fallbackMessage: "Unable to delete flashcard deck.",
    });
  } catch (cause) {
    toFlashcardsError(cause);
  }
}

export async function upsertFlashcardProgressApi(
  cardId: string,
  status: CardMastery,
  starred: boolean,
): Promise<CardProgressRecord> {
  try {
    return await requestJson(`/api/flashcards/cards/${cardId}/progress`, {
      method: "PUT",
      json: { status, starred },
      parse: parseProgress,
      fallbackMessage: "Unable to save card progress.",
    });
  } catch (cause) {
    toFlashcardsError(cause);
  }
}

export async function resetFlashcardDeckProgressApi(
  deckId: string,
): Promise<void> {
  try {
    await requestVoid(`/api/flashcards/decks/${deckId}/progress`, {
      method: "DELETE",
      fallbackMessage: "Unable to reset deck progress.",
    });
  } catch (cause) {
    toFlashcardsError(cause);
  }
}

export async function recordFlashcardMatchApi(
  deckId: string,
  elapsedMs: number,
  maxCombo: number,
): Promise<MatchRecord> {
  try {
    return await requestJson(`/api/flashcards/decks/${deckId}/match-records`, {
      method: "POST",
      json: { elapsedMs, maxCombo },
      parse: parseMatchRecord,
      fallbackMessage: "Unable to record Speed Match score.",
    });
  } catch (cause) {
    toFlashcardsError(cause);
  }
}
