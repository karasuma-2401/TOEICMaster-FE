import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BUILTIN_FLASHCARD_DECKS } from "../decks-data";
import { writeFlashcardStore } from "../storage";
import { FlashcardsWorkspace } from "./flashcards-workspace";

vi.mock("../api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api")>();
  return {
    ...actual,
    getFlashcardWorkspace: vi.fn().mockRejectedValue(new Error("Offline")),
  };
});

afterEach(() => {
  window.localStorage.clear();
});

describe("flashcards workspace account isolation", () => {
  it("shows only the current learner's custom decks after account scopes change", async () => {
    for (const learner of ["a", "b"]) {
      writeFlashcardStore(
        {
          progress: {},
          customDecks: [
            {
              ...BUILTIN_FLASHCARD_DECKS[0]!,
              id: `custom-${learner}`,
              slug: `learner-${learner}-deck`,
              title: `Learner ${learner.toUpperCase()} Deck`,
              isCustom: true,
            },
          ],
        },
        `learner-${learner}`,
      );
    }
    const { rerender } = render(
      <FlashcardsWorkspace
        key="learner-a"
        userId="learner-a"
        initialDeckSlug={null}
      />,
    );
    expect(await screen.findByText("Learner A Deck")).toBeInTheDocument();
    expect(screen.queryByText("Learner B Deck")).not.toBeInTheDocument();
    rerender(
      <FlashcardsWorkspace
        key="learner-b"
        userId="learner-b"
        initialDeckSlug={null}
      />,
    );
    expect(await screen.findByText("Learner B Deck")).toBeInTheDocument();
    expect(screen.queryByText("Learner A Deck")).not.toBeInTheDocument();
    rerender(
      <FlashcardsWorkspace key="guest" userId={null} initialDeckSlug={null} />,
    );
    expect(await screen.findByText("Saved on device")).toBeInTheDocument();
    expect(screen.queryByText("Learner A Deck")).not.toBeInTheDocument();
    expect(screen.queryByText("Learner B Deck")).not.toBeInTheDocument();
  });
});
