import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CreateFlashcardCardPayload } from "../api";
import type { FlashcardDeck } from "../types";
import { CardAddDialog } from "./card-add-dialog";
import { DeckCreateDialog } from "./deck-create-dialog";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function renderDeckDialog(
  onCreateDeck: (deck: FlashcardDeck) => Promise<void> | void = vi.fn(),
) {
  const onOpenChange = vi.fn();
  render(
    <DeckCreateDialog
      open
      onOpenChange={onOpenChange}
      onCreateDeck={onCreateDeck}
    />,
  );
  return { onOpenChange, onCreateDeck };
}

function fillDeck() {
  fireEvent.change(screen.getByRole("textbox", { name: /^Deck title/ }), {
    target: { value: "  Weekly TOEIC  " },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Card 1 term" }), {
    target: { value: "  invoice  " },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Card 1 meaning" }), {
    target: { value: "  payment bill  " },
  });
}

function renderCardDialog(
  onAddCard: (
    payload: CreateFlashcardCardPayload,
  ) => Promise<void> | void = vi.fn(),
) {
  const onOpenChange = vi.fn();
  render(
    <CardAddDialog
      open
      deckTitle="Personal Deck"
      onOpenChange={onOpenChange}
      onAddCard={onAddCard}
    />,
  );
  return { onOpenChange, onAddCard };
}

function fillCard() {
  fireEvent.change(screen.getByRole("textbox", { name: /^English term/ }), {
    target: { value: "  invoice  " },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /^Meaning/ }), {
    target: { value: "  payment bill  " },
  });
}

describe("DeckCreateDialog", () => {
  it("validates the title and required card fields, then submits only complete trimmed cards", async () => {
    const onCreateDeck = vi.fn<(deck: FlashcardDeck) => void>();
    const { onOpenChange } = renderDeckDialog(onCreateDeck);
    fireEvent.click(screen.getByRole("button", { name: "Save deck" }));
    expect(screen.getByText("Please enter a deck title.")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Card 1 term" }),
    ).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByRole("textbox", { name: "Card 1 meaning" }),
    ).toHaveAttribute("aria-invalid", "true");
    expect(onCreateDeck).not.toHaveBeenCalled();
    fillDeck();
    fireEvent.change(screen.getByRole("textbox", { name: "Card 2 term" }), {
      target: { value: "Incomplete row" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save deck" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    const created = onCreateDeck.mock.calls[0]![0];
    expect(created.title).toBe("Weekly TOEIC");
    expect(created.isCustom).toBe(true);
    expect(created.cards).toHaveLength(1);
    expect(created.cards[0]).toMatchObject({
      term: "invoice",
      meaningVi: "payment bill",
      partOfSpeech: "noun",
      collocations: [],
      level: "B2",
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /^Deck title/ })).toHaveValue(
      "",
    );
  });

  it("enforces matching field maxLength values on both draft rows and pasted input", async () => {
    const user = userEvent.setup();
    renderDeckDialog();
    expect(
      screen.getByRole("textbox", { name: /^Deck title/ }),
    ).toHaveAttribute("maxlength", "80");
    expect(
      screen.getByRole("textbox", { name: "Short description" }),
    ).toHaveAttribute("maxlength", "160");
    for (const [field, limit] of [
      ["term", 120],
      ["meaning", 300],
      ["pronunciation", 120],
      ["example sentence", 400],
    ] as const) {
      for (const row of [1, 2]) {
        expect(
          screen.getByRole("textbox", { name: `Card ${row} ${field}` }),
        ).toHaveAttribute("maxlength", String(limit));
      }
      const input = screen.getByRole("textbox", { name: `Card 1 ${field}` });
      await user.click(input);
      await user.paste("x".repeat(limit + 1));
      expect(input).toHaveValue("x".repeat(limit));
    }
  });

  it("caps batched additions at 200 cards, explains the limit, and allows replacement after removal", () => {
    renderDeckDialog();
    const add = screen.getByRole("button", { name: "Add card" });
    act(() => {
      for (let index = 0; index < 205; index += 1) fireEvent.click(add);
    });
    expect(screen.getByText("Cards (200)")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Card \d+ term/)).toHaveLength(200);
    expect(screen.queryByLabelText("Card 201 term")).not.toBeInTheDocument();
    expect(add).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Maximum of 200 cards per deck reached. Remove a card to add another.",
    );
    expect(add).toHaveAccessibleDescription(
      "Maximum of 200 cards per deck reached. Remove a card to add another.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove card 200" }));
    expect(screen.getByText("Cards (199)")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(add).toBeEnabled();
    fireEvent.click(add);
    expect(screen.getByText("Cards (200)")).toBeInTheDocument();
    expect(add).toBeDisabled();
  }, 20_000);

  it("preserves the draft and allows retry after an async submission failure", async () => {
    const onCreateDeck = vi
      .fn<(deck: FlashcardDeck) => Promise<void>>()
      .mockRejectedValueOnce(new Error("Deck service unavailable"))
      .mockResolvedValueOnce(undefined);
    const { onOpenChange } = renderDeckDialog(onCreateDeck);
    fillDeck();
    fireEvent.click(screen.getByRole("button", { name: "Save deck" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Deck service unavailable",
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: /^Deck title/ })).toHaveValue(
      "  Weekly TOEIC  ",
    );
    expect(screen.getByRole("textbox", { name: "Card 1 term" })).toHaveValue(
      "  invoice  ",
    );
    expect(screen.getByRole("button", { name: "Save deck" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Save deck" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(onCreateDeck).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("prevents duplicate saves and dismissal while submission is pending", async () => {
    const pending = deferred();
    const onCreateDeck = vi
      .fn<(deck: FlashcardDeck) => Promise<void>>()
      .mockReturnValue(pending.promise);
    const { onOpenChange } = renderDeckDialog(onCreateDeck);
    fillDeck();
    fireEvent.click(screen.getByRole("button", { name: "Save deck" }));
    const saving = screen.getByRole("button", { name: "Saving…" });
    expect(saving).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Close dialog" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add card" })).toBeDisabled();
    fireEvent.click(saving);
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });
    expect(onCreateDeck).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    await act(async () => pending.resolve());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("CardAddDialog", () => {
  it("validates required fields and submits trimmed vocabulary and collocations", async () => {
    const onAddCard = vi.fn<(payload: CreateFlashcardCardPayload) => void>();
    const { onOpenChange } = renderCardDialog(onAddCard);
    fireEvent.click(screen.getByRole("button", { name: "Add to Deck" }));
    expect(
      screen.getByText("Please enter an English term."),
    ).toBeInTheDocument();
    expect(screen.getByText("Please enter the meaning.")).toBeInTheDocument();
    expect(onAddCard).not.toHaveBeenCalled();
    fillCard();
    fireEvent.change(
      screen.getByRole("textbox", { name: "Collocations (comma-separated)" }),
      { target: { value: "  issue an invoice, , overdue invoice  " } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Add to Deck" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(onAddCard).toHaveBeenCalledWith(
      expect.objectContaining({
        term: "invoice",
        meaningVi: "payment bill",
        collocations: ["issue an invoice", "overdue invoice"],
      }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([
    {
      value: Array.from({ length: 11 }, (_item, index) => `word-${index}`).join(
        ",",
      ),
      message: "You can add at most 10 collocations.",
    },
    {
      value: "x".repeat(81),
      message: "Each collocation must be 80 characters or fewer.",
    },
  ])("rejects invalid collocations: $message", ({ value, message }) => {
    const { onAddCard } = renderCardDialog();
    fillCard();
    fireEvent.change(
      screen.getByRole("textbox", { name: "Collocations (comma-separated)" }),
      { target: { value } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Add to Deck" }));
    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(onAddCard).not.toHaveBeenCalled();
  });

  it("sets the API length limits on all optional and required text fields", () => {
    renderCardDialog();
    for (const [name, limit] of [
      [/^English term/, 120],
      [/^Meaning/, 300],
      ["IPA pronunciation", 120],
      ["Example sentence", 400],
      ["Example explanation", 400],
      ["Collocations (comma-separated)", 500],
    ] as const) {
      expect(screen.getByRole("textbox", { name })).toHaveAttribute(
        "maxlength",
        String(limit),
      );
    }
  });

  it("keeps values and recovers after an async add-card failure", async () => {
    const onAddCard = vi
      .fn<(payload: CreateFlashcardCardPayload) => Promise<void>>()
      .mockRejectedValueOnce(new Error("Card service unavailable"))
      .mockResolvedValueOnce(undefined);
    const { onOpenChange } = renderCardDialog(onAddCard);
    fillCard();
    fireEvent.click(screen.getByRole("button", { name: "Add to Deck" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Card service unavailable",
    );
    expect(screen.getByRole("textbox", { name: /^English term/ })).toHaveValue(
      "  invoice  ",
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Add to Deck" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(onAddCard).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("blocks duplicate additions and closing while the API is pending", async () => {
    const pending = deferred();
    const onAddCard = vi
      .fn<(payload: CreateFlashcardCardPayload) => Promise<void>>()
      .mockReturnValue(pending.promise);
    const { onOpenChange } = renderCardDialog(onAddCard);
    fillCard();
    fireEvent.click(screen.getByRole("button", { name: "Add to Deck" }));
    const saving = screen.getByRole("button", { name: "Saving…" });
    expect(saving).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Close dialog" })).toBeDisabled();
    fireEvent.click(saving);
    expect(onAddCard).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    await act(async () => pending.resolve());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
