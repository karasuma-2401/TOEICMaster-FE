import { describe, expect, it } from "vitest";
import { BUILTIN_FLASHCARD_DECKS } from "./decks-data";
import {
  buildQuizQuestions,
  filterDeckCards,
  parseFlashcardStore,
  slugifyDeckTitle,
  summarizeDeckProgress,
} from "./storage";
import type { CardProgressRecord } from "./types";

const sampleCards = BUILTIN_FLASHCARD_DECKS[0].cards;

describe("flashcards storage & helpers", () => {
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
            { id: "k1", term: "invoice", meaningVi: "hóa đơn" },
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

  it("slugifies Vietnamese deck titles cleanly", () => {
    expect(slugifyDeckTitle("Từ vựng Hợp đồng & Đàm phán")).toBe(
      "tu-vung-hop-dong-dam-phan",
    );
  });
});
