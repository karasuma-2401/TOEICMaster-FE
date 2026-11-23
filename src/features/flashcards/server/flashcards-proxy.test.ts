import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { forwardFlashcards } from "./flashcards-proxy";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("flashcards server proxy", () => {
  it("rejects unknown paths with 404", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/flashcards/unknown",
    );
    const response = await forwardFlashcards(request, ["unknown"], "GET");
    expect(response.status).toBe(404);
  });

  it("rejects unsupported methods on known routes with 405", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/flashcards/decks",
      {
        method: "DELETE",
        headers: { origin: "http://localhost:3000" },
      },
    );
    const response = await forwardFlashcards(request, ["decks"], "DELETE");
    expect(response.status).toBe(405);
  });

  it("requires authentication for mutations such as creating a deck or adding a card", async () => {
    const createRequest = new NextRequest(
      "http://localhost:3000/api/flashcards/decks",
      {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          "content-type": "application/json",
        },
        body: JSON.stringify({ title: "Test", cards: [] }),
      },
    );
    const createResponse = await forwardFlashcards(
      createRequest,
      ["decks"],
      "POST",
    );
    expect(createResponse.status).toBe(401);

    const addCardRequest = new NextRequest(
      "http://localhost:3000/api/flashcards/decks/10000000-0000-4000-8000-000000000001/cards",
      {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          "content-type": "application/json",
        },
        body: JSON.stringify({ term: "invoice", meaningVi: "invoice" }),
      },
    );
    const addCardResponse = await forwardFlashcards(
      addCardRequest,
      ["decks", "10000000-0000-4000-8000-000000000001", "cards"],
      "POST",
    );
    expect(addCardResponse.status).toBe(401);

    const matchRequest = new NextRequest(
      "http://localhost:3000/api/flashcards/decks/10000000-0000-4000-8000-000000000001/match-records",
      {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          "content-type": "application/json",
        },
        body: JSON.stringify({ elapsedMs: 15000, maxCombo: 5 }),
      },
    );
    const matchResponse = await forwardFlashcards(
      matchRequest,
      ["decks", "10000000-0000-4000-8000-000000000001", "match-records"],
      "POST",
    );
    expect(matchResponse.status).toBe(401);
  });

  it("allows public GET /decks and forwards to /api/v1/flashcards/decks", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ decks: [], progress: {} }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const request = new NextRequest(
      "http://localhost:3000/api/flashcards/decks",
    );
    const response = await forwardFlashcards(request, ["decks"], "GET");

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toBe(
      "http://localhost:5287/api/v1/flashcards/decks",
    );
  });
});
