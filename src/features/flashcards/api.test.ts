import { describe, expect, it } from "vitest";
import { isServerGuid, parseDeck, parseProgress, parseWorkspace } from "./api";

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
          title: "Văn phòng",
          description: "Mô tả",
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
              meaningVi: "lịch trình chi tiết",
              exampleEn: "Review the itinerary.",
              exampleVi: "Xem lại lịch trình.",
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
