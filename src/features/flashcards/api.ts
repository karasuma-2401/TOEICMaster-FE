import type {
  CardMastery,
  CardProgressRecord,
  CefrLevel,
  FlashcardCategory,
  FlashcardDeck,
  FlashcardItem,
  MatchRecord,
} from "./types";

export { isGuid as isServerGuid } from "@/shared/lib/guards";

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

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (isRecord(data) && typeof data.detail === "string") return data.detail;
    if (isRecord(data) && typeof data.title === "string") return data.title;
  } catch {
    // Fall back to generic message.
  }
  return `Request failed (HTTP ${response.status}).`;
}

export async function getFlashcardWorkspace(): Promise<FlashcardWorkspaceApiResponse> {
  const response = await fetch("/api/flashcards/decks", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new FlashcardsApiError(
      response.status,
      await readErrorMessage(response),
    );
  }
  return parseWorkspace(await response.json());
}

export async function createFlashcardDeckApi(
  payload: CreateFlashcardDeckPayload,
): Promise<FlashcardDeck> {
  const response = await fetch("/api/flashcards/decks", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new FlashcardsApiError(
      response.status,
      await readErrorMessage(response),
    );
  }
  return parseDeck(await response.json());
}

export async function addFlashcardCardApi(
  deckId: string,
  payload: CreateFlashcardCardPayload,
): Promise<FlashcardItem> {
  const response = await fetch(`/api/flashcards/decks/${deckId}/cards`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new FlashcardsApiError(
      response.status,
      await readErrorMessage(response),
    );
  }
  return parseCard(await response.json());
}

export async function deleteFlashcardDeckApi(deckId: string): Promise<void> {
  const response = await fetch(`/api/flashcards/decks/${deckId}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  if (!response.ok && response.status !== 204) {
    throw new FlashcardsApiError(
      response.status,
      await readErrorMessage(response),
    );
  }
}

export async function upsertFlashcardProgressApi(
  cardId: string,
  status: CardMastery,
  starred: boolean,
): Promise<CardProgressRecord> {
  const response = await fetch(`/api/flashcards/cards/${cardId}/progress`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status, starred }),
  });
  if (!response.ok) {
    throw new FlashcardsApiError(
      response.status,
      await readErrorMessage(response),
    );
  }
  return parseProgress(await response.json());
}

export async function resetFlashcardDeckProgressApi(
  deckId: string,
): Promise<void> {
  const response = await fetch(`/api/flashcards/decks/${deckId}/progress`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  if (!response.ok && response.status !== 204) {
    throw new FlashcardsApiError(
      response.status,
      await readErrorMessage(response),
    );
  }
}

export async function recordFlashcardMatchApi(
  deckId: string,
  elapsedMs: number,
  maxCombo: number,
): Promise<MatchRecord> {
  const response = await fetch(
    `/api/flashcards/decks/${deckId}/match-records`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ elapsedMs, maxCombo }),
    },
  );
  if (!response.ok) {
    throw new FlashcardsApiError(
      response.status,
      await readErrorMessage(response),
    );
  }
  return parseMatchRecord(await response.json());
}
