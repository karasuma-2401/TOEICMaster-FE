import type {
  CardFilter,
  CardMastery,
  CardProgressRecord,
  DeckProgressSummary,
  FlashcardDeck,
  FlashcardItem,
  FlashcardStoreState,
  QuizQuestion,
} from "./types";

export const FLASHCARD_STORAGE_KEY = "toeicmaster.flashcards.v1";

export const EMPTY_FLASHCARD_STORE: FlashcardStoreState = {
  progress: {},
  customDecks: [],
};

const VALID_STATUSES = new Set<CardMastery>([
  "new",
  "learning",
  "review",
  "mastered",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeCard(raw: unknown): FlashcardItem | null {
  if (!isRecord(raw)) return null;
  if (
    typeof raw.id !== "string" ||
    typeof raw.term !== "string" ||
    typeof raw.meaningVi !== "string"
  ) {
    return null;
  }
  const term = raw.term.trim();
  const meaningVi = raw.meaningVi.trim();
  if (!term || !meaningVi) return null;

  return {
    id: raw.id,
    term,
    phonetic: typeof raw.phonetic === "string" ? raw.phonetic : "",
    partOfSpeech:
      typeof raw.partOfSpeech === "string" ? raw.partOfSpeech : "noun",
    meaningVi,
    exampleEn: typeof raw.exampleEn === "string" ? raw.exampleEn : "",
    exampleVi: typeof raw.exampleVi === "string" ? raw.exampleVi : "",
    collocations: Array.isArray(raw.collocations)
      ? raw.collocations.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    toeicPart:
      typeof raw.toeicPart === "string" ? raw.toeicPart : "TOEIC Vocab",
    level:
      raw.level === "B1" || raw.level === "B2" || raw.level === "C1"
        ? raw.level
        : "B2",
  };
}

function sanitizeDeck(raw: unknown): FlashcardDeck | null {
  if (!isRecord(raw)) return null;
  if (
    typeof raw.id !== "string" ||
    typeof raw.slug !== "string" ||
    typeof raw.title !== "string" ||
    !Array.isArray(raw.cards)
  ) {
    return null;
  }
  const cards = raw.cards
    .map(sanitizeCard)
    .filter((card): card is FlashcardItem => card !== null);
  if (cards.length === 0) return null;

  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title.trim() || "Custom Deck",
    description: typeof raw.description === "string" ? raw.description : "",
    category: "custom",
    targetScore:
      typeof raw.targetScore === "string" ? raw.targetScore : "Custom",
    estimatedMinutes:
      typeof raw.estimatedMinutes === "number" && raw.estimatedMinutes > 0
        ? raw.estimatedMinutes
        : Math.max(2, Math.ceil(cards.length * 0.8)),
    isCustom: true,
    cards,
  };
}

export function parseFlashcardStore(raw: string | null): FlashcardStoreState {
  if (!raw) return EMPTY_FLASHCARD_STORE;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return EMPTY_FLASHCARD_STORE;

    const progress: Record<string, CardProgressRecord> = {};
    if (isRecord(parsed.progress)) {
      for (const [cardId, entry] of Object.entries(parsed.progress)) {
        if (!isRecord(entry)) continue;
        const status =
          typeof entry.status === "string" &&
          VALID_STATUSES.has(entry.status as CardMastery)
            ? (entry.status as CardMastery)
            : "new";
        progress[cardId] = {
          status,
          starred: Boolean(entry.starred),
          reviewCount:
            typeof entry.reviewCount === "number" && entry.reviewCount >= 0
              ? entry.reviewCount
              : 0,
          updatedAt:
            typeof entry.updatedAt === "string"
              ? entry.updatedAt
              : new Date(0).toISOString(),
        };
      }
    }

    const customDecks = Array.isArray(parsed.customDecks)
      ? parsed.customDecks
          .map(sanitizeDeck)
          .filter((deck): deck is FlashcardDeck => deck !== null)
      : [];

    return { progress, customDecks };
  } catch {
    return EMPTY_FLASHCARD_STORE;
  }
}

export function readFlashcardStore(): FlashcardStoreState {
  if (typeof window === "undefined") return EMPTY_FLASHCARD_STORE;
  try {
    return parseFlashcardStore(
      window.localStorage.getItem(FLASHCARD_STORAGE_KEY),
    );
  } catch {
    return EMPTY_FLASHCARD_STORE;
  }
}

export function writeFlashcardStore(state: FlashcardStoreState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota or private-mode errors gracefully.
  }
}

export function getCardStatus(
  progress: Record<string, CardProgressRecord>,
  cardId: string,
): CardMastery {
  return progress[cardId]?.status ?? "new";
}

export function isCardStarred(
  progress: Record<string, CardProgressRecord>,
  cardId: string,
): boolean {
  return progress[cardId]?.starred ?? false;
}

export function summarizeDeckProgress(
  cards: readonly FlashcardItem[],
  progress: Record<string, CardProgressRecord>,
): DeckProgressSummary {
  let mastered = 0;
  let review = 0;
  let learning = 0;
  let unseen = 0;
  let starred = 0;

  for (const card of cards) {
    const entry = progress[card.id];
    if (entry?.starred) starred += 1;
    const status = entry?.status ?? "new";
    if (status === "mastered") mastered += 1;
    else if (status === "review") review += 1;
    else if (status === "learning") learning += 1;
    else unseen += 1;
  }

  const total = cards.length;
  const completionPercent =
    total === 0 ? 0 : Math.round((mastered / total) * 100);

  return {
    total,
    mastered,
    review,
    learning,
    unseen,
    starred,
    completionPercent,
  };
}

export function filterDeckCards(
  cards: readonly FlashcardItem[],
  progress: Record<string, CardProgressRecord>,
  filter: CardFilter,
): FlashcardItem[] {
  return cards.filter((card) => {
    const status = getCardStatus(progress, card.id);
    if (filter === "all") return true;
    if (filter === "unmastered") return status !== "mastered";
    if (filter === "review")
      return status === "review" || status === "learning";
    if (filter === "mastered") return status === "mastered";
    if (filter === "starred") return isCardStarred(progress, card.id);
    return true;
  });
}

export function shuffleCards<T>(
  items: readonly T[],
  rng: () => number = Math.random,
): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildQuizQuestions(
  cards: readonly FlashcardItem[],
  distractorPool: readonly FlashcardItem[],
  rng: () => number = Math.random,
): QuizQuestion[] {
  const pool = distractorPool.length >= 4 ? distractorPool : cards;
  return shuffleCards(cards, rng).map((card) => {
    const distractors = shuffleCards(
      pool.filter(
        (candidate) =>
          candidate.id !== card.id && candidate.meaningVi !== card.meaningVi,
      ),
      rng,
    ).slice(0, 3);

    const rawOptions = [
      { id: card.id, meaningVi: card.meaningVi, isCorrect: true },
      ...distractors.map((item) => ({
        id: item.id,
        meaningVi: item.meaningVi,
        isCorrect: false,
      })),
    ];

    return {
      card,
      options: shuffleCards(rawOptions, rng),
    };
  });
}

export function slugifyDeckTitle(title: string): string {
  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "custom-deck";
}
