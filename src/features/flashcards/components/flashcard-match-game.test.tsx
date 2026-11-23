import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BUILTIN_FLASHCARD_DECKS } from "../decks-data";
import { readFlashcardBestTime } from "../storage";
import { FlashcardMatchGame } from "./flashcard-match-game";

afterEach(() => {
  window.localStorage.clear();
});

describe("flashcard match game scoped records", () => {
  it("stores the result of a played round only for the current learner", async () => {
    const user = userEvent.setup();
    const cards = BUILTIN_FLASHCARD_DECKS[0]!.cards.slice(0, 2);
    const onRateCard = vi.fn();
    const onCompleteRun = vi.fn();
    const { rerender } = render(
      <FlashcardMatchGame
        deckId="deck-a"
        userId="learner-a"
        cards={cards}
        onRateCard={onRateCard}
        onCompleteRun={onCompleteRun}
      />,
    );
    for (const card of cards) {
      await user.click(
        screen.getByRole("button", {
          name: (_content, element) =>
            element?.tagName === "BUTTON" &&
            element.textContent?.includes(card.term) === true,
        }),
      );
      await user.click(
        screen.getByRole("button", {
          name: (_content, element) =>
            element?.tagName === "BUTTON" &&
            element.textContent?.includes(card.meaningVi) === true,
        }),
      );
    }
    expect(
      await screen.findByRole("heading", { name: "New record! Board cleared" }),
    ).toBeInTheDocument();
    for (const card of cards)
      expect(onRateCard).toHaveBeenCalledWith(card.id, "mastered");
    expect(onCompleteRun).toHaveBeenCalledWith(expect.any(Number), 2);
    expect(readFlashcardBestTime("deck-a", "learner-a")).toBeGreaterThan(0);
    expect(readFlashcardBestTime("deck-a", "learner-b")).toBeNull();
    rerender(
      <FlashcardMatchGame
        key="learner-b"
        deckId="deck-a"
        userId="learner-b"
        cards={cards}
        onRateCard={onRateCard}
      />,
    );
    expect(screen.queryByText(/Best:/)).not.toBeInTheDocument();
  });
});
