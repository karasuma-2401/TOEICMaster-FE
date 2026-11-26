import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FlashcardsApiError,
  getFlashcardWorkspace,
  isServerGuid,
  parseDeck,
  parseProgress,
  parseWorkspace,
} from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("flashcards api parsers", () => {
  it("validates GUID strings accurately", () => {
    expect(isServerGuid("10000000-0000-4000-8000-000000000001")).toBe(true);
    expect(isServerGuid("off-1")).toBe(false);
    expect(isServerGuid("custom-deck-123")).toBe(false);
  });

  it("parses backend FlashcardWorkspaceDto contract cleanly", () => {
    const payload = {
      decks: [
        {
          id: "10000000-0000-4000-8000-000000000001",
          slug: "office-operations",
          title: "Office",
          description: "Description",
          category: "office",
          targetScore: "500–750+",
          estimatedMinutes: 8,
          isCustom: false,
          cards: [
            {
              id: "10000001-0000-4000-8000-000000000001",
              term: "itinerary",
              phonetic: "/aɪˈtɪn.ə.rer.i/",
              partOfSpeech: "noun",
              meaningVi: "detailed itinerary",
              exampleEn: "Review the itinerary.",
              exampleVi: "Review the itinerary again.",
              collocations: ["travel itinerary"],
              toeicPart: "Part 3 · Part 7",
              level: "B2",
            },
          ],
        },
      ],
      progress: {
        "10000001-0000-4000-8000-000000000001": {
          status: "mastered",
          starred: true,
          reviewCount: 2,
          updatedAt: "2026-11-21T10:00:00Z",
        },
      },
      matchRecords: {
        "10000000-0000-4000-8000-000000000001": {
          bestTimeMs: 14200,
          bestCombo: 6,
          playCount: 3,
          updatedAt: "2026-11-21T10:05:00Z",
        },
      },
    };

    const parsed = parseWorkspace(payload);
    expect(parsed.decks).toHaveLength(1);
    expect(parsed.decks[0]?.cards[0]?.term).toBe("itinerary");
    expect(
      parsed.progress["10000001-0000-4000-8000-000000000001"]?.status,
    ).toBe("mastered");
    expect(
      parsed.matchRecords["10000000-0000-4000-8000-000000000001"]?.bestTimeMs,
    ).toBe(14200);
  });

  it("rejects malformed deck or progress payloads", () => {
    expect(() => parseDeck(null)).toThrow();
    expect(() => parseProgress("bad")).toThrow();
  });
});

describe("flashcards API cancellation and errors", () => {
  it("rethrows the original AbortError when a workspace fetch is cancelled", async () => {
    const controller = new AbortController();
    const abortError = new DOMException("Caller cancelled", "AbortError");
    const fetchMock = vi.fn<typeof fetch>(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(abortError), {
            once: true,
          });
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const pending = getFlashcardWorkspace(controller.signal);
    controller.abort();

    await expect(pending).rejects.toBe(abortError);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/flashcards/decks",
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("preserves Error-shaped AbortError without an explicit signal", async () => {
    const abortError = new Error("Caller cancelled");
    abortError.name = "AbortError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    await expect(getFlashcardWorkspace()).rejects.toBe(abortError);
  });

  it("still converts network errors to FlashcardsApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));

    await expect(getFlashcardWorkspace()).rejects.toBeInstanceOf(
      FlashcardsApiError,
    );
    await expect(getFlashcardWorkspace()).rejects.toMatchObject({
      status: 502,
    });
  });
});
