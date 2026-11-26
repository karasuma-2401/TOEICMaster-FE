import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BUILTIN_FLASHCARD_DECKS } from "../decks-data";
import { readFlashcardBestTime } from "../storage";
import type { FlashcardItem } from "../types";
import { FlashcardMatchGame } from "./flashcard-match-game";

afterEach(() => {
  vi.useRealTimers();
  window.localStorage.clear();
});

const roundCards: FlashcardItem[] = Array.from(
  { length: 7 },
  (_item, index) => ({
    ...BUILTIN_FLASHCARD_DECKS[0]!.cards[0]!,
    id: `card-${index + 1}`,
    term: `Term ${index + 1}`,
    meaningVi: `Meaning ${index + 1}`,
  }),
);

function tile(text: string) {
  return screen.getByRole("button", {
    name: (_content, element) => element?.textContent?.includes(text) === true,
  });
}

function matchCards(cards: readonly FlashcardItem[]) {
  for (const card of cards) {
    fireEvent.click(tile(card.term));
    fireEvent.click(tile(card.meaningVi));
  }
}

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
    expect(readFlashcardBestTime("deck-a", 2, "learner-a")).toBeGreaterThan(0);
    expect(readFlashcardBestTime("deck-a", 2, "learner-b")).toBeNull();
    expect(readFlashcardBestTime("deck-a", 6, "learner-a")).toBeNull();
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

  it("freezes the timer and ignores tile clicks until resumed", () => {
    vi.useFakeTimers();
    const onRateCard = vi.fn();
    render(
      <FlashcardMatchGame
        deckId="deck-a"
        userId={null}
        cards={roundCards.slice(0, 2)}
        onRateCard={onRateCard}
      />,
    );
    const firstTerm = tile("Term 1");
    const secondTerm = tile("Term 2");
    const firstMeaning = tile("Meaning 1");
    fireEvent.click(firstTerm);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("1.0s")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByRole("button", { name: "Resume" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.queryByRole("button", { name: /Term 1/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(secondTerm);
    fireEvent.click(firstMeaning);
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByText("1.0s")).toBeInTheDocument();
    expect(firstTerm).toHaveAttribute("aria-pressed", "true");
    expect(secondTerm).toHaveAttribute("aria-pressed", "false");
    expect(onRateCard).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    expect(tile("Term 1")).toHaveAttribute("aria-pressed", "true");
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText("1.5s")).toBeInTheDocument();
    fireEvent.click(tile("Meaning 1"));
    expect(onRateCard).toHaveBeenCalledWith("card-1", "mastered");
  });

  it("keeps Resume available when paused immediately after the first tile", () => {
    vi.useFakeTimers();
    render(
      <FlashcardMatchGame
        deckId="deck-a"
        userId={null}
        cards={roundCards.slice(0, 2)}
        onRateCard={vi.fn()}
      />,
    );
    fireEvent.click(tile("Term 1"));
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByText("0.1s")).toBeInTheDocument();
  });

  it("pads the trailing round to six distinct pairs and records the same board size", () => {
    const onCompleteRun = vi.fn();
    render(
      <FlashcardMatchGame
        deckId="deck-a"
        userId="learner-a"
        cards={roundCards}
        onRateCard={vi.fn()}
        onCompleteRun={onCompleteRun}
      />,
    );
    matchCards(roundCards.slice(0, 6));
    fireEvent.click(
      screen.getByRole("button", { name: /Play next round \(2\/2\)/ }),
    );
    expect(screen.getByText("0/6")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Term/ })).toHaveLength(6);
    expect(screen.getAllByRole("button", { name: /^Meaning/ })).toHaveLength(6);
    expect(tile("Term 7")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Term 6/ }),
    ).not.toBeInTheDocument();
    matchCards([roundCards[6]!, ...roundCards.slice(0, 5)]);
    expect(onCompleteRun).toHaveBeenCalledTimes(2);
    expect(onCompleteRun).toHaveBeenLastCalledWith(expect.any(Number), 6);
    expect(readFlashcardBestTime("deck-a", 6, "learner-a")).toBeGreaterThan(0);
    expect(readFlashcardBestTime("deck-a", 1, "learner-a")).toBeNull();
  });

  it("clears active mismatch and clock timers when unmounted", () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <FlashcardMatchGame
        deckId="deck-a"
        userId={null}
        cards={roundCards.slice(0, 2)}
        onRateCard={vi.fn()}
      />,
    );
    fireEvent.click(tile("Term 1"));
    fireEvent.click(tile("Meaning 2"));
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
