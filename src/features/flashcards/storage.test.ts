import { afterEach, describe, expect, it, vi } from "vitest";
import { writeScopedStorage } from "@/shared/lib/storage";
import { BUILTIN_FLASHCARD_DECKS } from "./decks-data";
import {
  buildQuizQuestions,
  filterDeckCards,
  parseFlashcardStore,
  readFlashcardBestTime,
  readFlashcardStore,
  slugifyDeckTitle,
  summarizeDeckProgress,
  writeFlashcardBestTime,
  writeFlashcardStore,
} from "./storage";
import type { CardProgressRecord, FlashcardStoreState } from "./types";

const sampleCards = BUILTIN_FLASHCARD_DECKS[0].cards;

afterEach(() => {
  vi.unstubAllGlobals();
});

function browserStore() {
  const values = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    },
  });
  return values;
}

describe("flashcards storage & helpers", () => {
  it("isolates persisted progress across learners and the guest scope", () => {
    browserStore();
    const state: FlashcardStoreState = {
      progress: {
        "off-1": {
          status: "mastered",
          starred: true,
          reviewCount: 2,
          updatedAt: "2026-11-24T00:00:00Z",
        },
      },
      customDecks: [],
    };
    writeFlashcardStore(state, "learner-a");
    expect(readFlashcardStore("learner-a")).toEqual(state);
    expect(readFlashcardStore("learner-b").progress).toEqual({});
    expect(readFlashcardStore(null).progress).toEqual({});
    writeFlashcardStore({ ...state, progress: {} }, "learner-b");
    expect(readFlashcardStore("learner-a")).toEqual(state);
  });

  it("does not assign ambiguous legacy progress or match records to any account or guests", () => {
    const values = browserStore();
    values.set(
      "toeicmaster.flashcards.v1",
      JSON.stringify({ progress: { old: { status: "mastered" } } }),
    );
    values.set("toeicmaster.fc.match.best.deck", "1000");
    for (const userId of [null, "learner-a", "learner-b"]) {
      expect(readFlashcardStore(userId).progress).toEqual({});
      expect(readFlashcardBestTime("deck", userId)).toBeNull();
    }
    expect(values.size).toBe(2);
  });

  it("isolates and validates match best times by learner and deck", () => {
    browserStore();
    writeFlashcardBestTime("deck-a", 1250, "learner-a");
    expect(readFlashcardBestTime("deck-a", "learner-a")).toBe(1250);
    expect(readFlashcardBestTime("deck-b", "learner-a")).toBeNull();
    expect(readFlashcardBestTime("deck-a", "learner-b")).toBeNull();
    expect(readFlashcardBestTime("deck-a", null)).toBeNull();
    writeFlashcardBestTime("deck-a", Number.NaN, "learner-a");
    expect(readFlashcardBestTime("deck-a", "learner-a")).toBe(1250);
    writeScopedStorage(
      { namespace: "flashcards", userId: "learner-a" },
      "match-best:deck-a",
      "invalid",
    );
    expect(readFlashcardBestTime("deck-a", "learner-a")).toBeNull();
  });

  it("parses empty or malformed JSON safely into empty store", () => {
    expect(parseFlashcardStore(null)).toEqual({
      progress: {},
      customDecks: [],
    });
    expect(parseFlashcardStore("not-json")).toEqual({
      progress: {},
      customDecks: [],
    });
    expect(parseFlashcardStore("[]")).toEqual({
      progress: {},
      customDecks: [],
    });
  });

  it("sanitizes persisted progress and custom decks", () => {
    const raw = JSON.stringify({
      progress: {
        "off-1": {
          status: "mastered",
          starred: true,
          reviewCount: 3,
          updatedAt: "2026-11-21T10:00:00.000Z",
        },
        "off-2": {
          status: "invalid-status",
          starred: false,
          reviewCount: -5,
        },
      },
      customDecks: [
        {
          id: "c1",
          slug: "my-deck",
          title: "My TOEIC List",
          cards: [
            { id: "k1", term: "invoice", meaningVi: "invoice" },
            { id: "k2", term: "", meaningVi: "invalid" },
          ],
        },
      ],
    });

    const parsed = parseFlashcardStore(raw);
    expect(parsed.progress["off-1"]?.status).toBe("mastered");
    expect(parsed.progress["off-1"]?.starred).toBe(true);
    expect(parsed.progress["off-2"]?.status).toBe("new");
    expect(parsed.progress["off-2"]?.reviewCount).toBe(0);
    expect(parsed.customDecks).toHaveLength(1);
    expect(parsed.customDecks[0]?.cards).toHaveLength(1);
    expect(parsed.customDecks[0]?.cards[0]?.term).toBe("invoice");
  });

  it("summarizes deck progress accurately", () => {
    const progress: Record<string, CardProgressRecord> = {
      [sampleCards[0].id]: {
        status: "mastered",
        starred: true,
        reviewCount: 2,
        updatedAt: "2026-11-21T00:00:00.000Z",
      },
      [sampleCards[1].id]: {
        status: "review",
        starred: false,
        reviewCount: 1,
        updatedAt: "2026-11-21T00:00:00.000Z",
      },
      [sampleCards[2].id]: {
        status: "learning",
        starred: true,
        reviewCount: 1,
        updatedAt: "2026-11-21T00:00:00.000Z",
      },
    };

    const summary = summarizeDeckProgress(sampleCards, progress);
    expect(summary.total).toBe(sampleCards.length);
    expect(summary.mastered).toBe(1);
    expect(summary.review).toBe(1);
    expect(summary.learning).toBe(1);
    expect(summary.unseen).toBe(sampleCards.length - 3);
    expect(summary.starred).toBe(2);
    expect(summary.completionPercent).toBe(
      Math.round((1 / sampleCards.length) * 100),
    );
  });

  it("filters cards by mastery and starred state", () => {
    const progress: Record<string, CardProgressRecord> = {
      [sampleCards[0].id]: {
        status: "mastered",
        starred: true,
        reviewCount: 1,
        updatedAt: "2026-11-21T00:00:00.000Z",
      },
      [sampleCards[1].id]: {
        status: "review",
        starred: false,
        reviewCount: 1,
        updatedAt: "2026-11-21T00:00:00.000Z",
      },
    };

    expect(filterDeckCards(sampleCards, progress, "mastered")).toHaveLength(1);
    expect(filterDeckCards(sampleCards, progress, "review")).toHaveLength(1);
    expect(filterDeckCards(sampleCards, progress, "starred")).toHaveLength(1);
    expect(filterDeckCards(sampleCards, progress, "unmastered")).toHaveLength(
      sampleCards.length - 1,
    );
  });

  it("builds 4-option quiz questions with exactly one correct answer", () => {
    const allCards = BUILTIN_FLASHCARD_DECKS.flatMap((deck) => deck.cards);
    const questions = buildQuizQuestions(sampleCards, allCards, () => 0.42);
    expect(questions).toHaveLength(sampleCards.length);
    for (const q of questions) {
      expect(q.options).toHaveLength(4);
      expect(q.options.filter((opt) => opt.isCorrect)).toHaveLength(1);
    }
  });

  it("slugifies deck titles cleanly", () => {
    expect(slugifyDeckTitle("Contracts & Negotiation Vocabulary!")).toBe(
      "contracts-negotiation-vocabulary",
    );
  });
});
