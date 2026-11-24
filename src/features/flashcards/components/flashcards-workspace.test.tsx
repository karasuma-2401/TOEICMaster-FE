import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteFlashcardDeckApi,
  getFlashcardWorkspace,
  resetFlashcardDeckProgressApi,
  upsertFlashcardProgressApi,
  type FlashcardWorkspaceApiResponse,
} from "../api";
import { BUILTIN_FLASHCARD_DECKS } from "../decks-data";
import { readFlashcardStore, writeFlashcardStore } from "../storage";
import type { CardProgressRecord, FlashcardDeck } from "../types";
import { FlashcardsWorkspace } from "./flashcards-workspace";

vi.mock("../api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api")>();
  return {
    ...actual,
    getFlashcardWorkspace: vi.fn(),
    deleteFlashcardDeckApi: vi.fn(),
    upsertFlashcardProgressApi: vi.fn(),
    resetFlashcardDeckProgressApi: vi.fn(),
  };
});

beforeEach(() => {
  vi.mocked(resetFlashcardDeckProgressApi)
    .mockReset()
    .mockResolvedValue(undefined);
  window.history.replaceState(null, "", "/flashcards");
  vi.mocked(getFlashcardWorkspace)
    .mockReset()
    .mockRejectedValue(new Error("Offline"));
  vi.mocked(deleteFlashcardDeckApi).mockReset().mockResolvedValue(undefined);
  vi.mocked(upsertFlashcardProgressApi)
    .mockReset()
    .mockRejectedValue(new Error("Offline"));
});

afterEach(() => {
  window.localStorage.clear();
});

const sampleDeck = BUILTIN_FLASHCARD_DECKS[0]!;
const sampleCard = sampleDeck.cards[0]!;
const remoteDeck: FlashcardDeck = {
  ...sampleDeck,
  id: "10000000-0000-4000-8000-000000009999",
  slug: "personal-deck",
  title: "Personal Deck",
  category: "custom",
  isCustom: true,
  cards: [sampleCard],
};
const workspace: FlashcardWorkspaceApiResponse = {
  decks: [remoteDeck],
  progress: {},
  matchRecords: {},
};
const staleProgress: CardProgressRecord = {
  status: "mastered",
  starred: true,
  reviewCount: 3,
  updatedAt: "2026-11-24T00:00:00Z",
};

function deferred<Value>() {
  let resolve!: (value: Value) => void;
  let reject!: (cause: unknown) => void;
  const promise = new Promise<Value>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function renderWorkspace(
  userId: string | null = "learner-a",
  initialDeckSlug: string | null = null,
) {
  return render(
    <FlashcardsWorkspace userId={userId} initialDeckSlug={initialDeckSlug} />,
  );
}

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

describe("flashcards workspace deletion confirmation", () => {
  it("cancels without deleting, restores focus, and removes a local deck only after confirmation", async () => {
    const user = userEvent.setup();
    const localDeck = { ...remoteDeck, id: "custom-local-deck" };
    writeFlashcardStore({ progress: {}, customDecks: [localDeck] }, null);
    renderWorkspace(null);
    const trigger = await screen.findByRole("button", {
      name: "Delete deck Personal Deck",
    });
    await user.click(trigger);
    expect(
      screen.getByRole("dialog", { name: "Delete custom deck?" }),
    ).toHaveTextContent("Personal Deck");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(readFlashcardStore(null).customDecks).toEqual([localDeck]);
    expect(deleteFlashcardDeckApi).not.toHaveBeenCalled();
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Delete deck" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Personal Deck" }),
    ).not.toBeInTheDocument();
    expect(readFlashcardStore(null).customDecks).toEqual([]);
    expect(deleteFlashcardDeckApi).not.toHaveBeenCalled();
  });

  it("waits for a server deletion and prevents duplicate requests while pending", async () => {
    const user = userEvent.setup();
    const pending = deferred<void>();
    vi.mocked(getFlashcardWorkspace).mockResolvedValue(workspace);
    vi.mocked(deleteFlashcardDeckApi).mockReturnValue(pending.promise);
    writeFlashcardStore(
      { progress: {}, customDecks: [remoteDeck] },
      "learner-a",
    );
    renderWorkspace();
    await screen.findByText("Synced with server");
    await user.click(
      screen.getByRole("button", { name: "Delete deck Personal Deck" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete deck" }));
    await user.click(screen.getByRole("button", { name: "Deleting…" }));
    expect(deleteFlashcardDeckApi).toHaveBeenCalledExactlyOnceWith(
      remoteDeck.id,
    );
    expect(readFlashcardStore("learner-a").customDecks).toHaveLength(1);
    await act(async () => pending.resolve());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Personal Deck" }),
    ).not.toBeInTheDocument();
    expect(readFlashcardStore("learner-a").customDecks).toEqual([]);
  });

  it("keeps the deck and dialog on an API failure and supports retry", async () => {
    const user = userEvent.setup();
    vi.mocked(getFlashcardWorkspace).mockResolvedValue(workspace);
    vi.mocked(deleteFlashcardDeckApi)
      .mockRejectedValueOnce(new Error("Delete service unavailable"))
      .mockResolvedValueOnce(undefined);
    renderWorkspace();
    await screen.findByText("Synced with server");
    await user.click(
      screen.getByRole("button", { name: "Delete deck Personal Deck" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete deck" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Delete service unavailable",
    );
    expect(
      screen.getByRole("dialog", { name: "Delete custom deck?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Personal Deck", { selector: "h2" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete deck" }));
    expect(deleteFlashcardDeckApi).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Personal Deck", { selector: "h2" }),
    ).not.toBeInTheDocument();
  });
});

describe("flashcards workspace synchronization", () => {
  it.each(["resolve", "reject"] as const)(
    "aborts replaced requests and ignores a late %s without a spurious offline state",
    async (settlement) => {
      const pending = deferred<FlashcardWorkspaceApiResponse>();
      const secondWorkspace = {
        ...workspace,
        decks: [{ ...remoteDeck, title: "Learner B Deck" }],
      };
      vi.mocked(getFlashcardWorkspace)
        .mockReturnValueOnce(pending.promise)
        .mockResolvedValueOnce(secondWorkspace);
      const { rerender, unmount } = renderWorkspace();
      await waitFor(() =>
        expect(getFlashcardWorkspace).toHaveBeenCalledTimes(1),
      );
      const firstSignal = vi.mocked(getFlashcardWorkspace).mock.calls[0]![0];
      expect(firstSignal?.aborted).toBe(false);
      rerender(
        <FlashcardsWorkspace userId="learner-b" initialDeckSlug={null} />,
      );
      await screen.findByText("Learner B Deck");
      expect(firstSignal?.aborted).toBe(true);
      await act(async () => {
        if (settlement === "resolve") pending.resolve(workspace);
        else pending.reject(new DOMException("Caller cancelled", "AbortError"));
      });
      expect(screen.getByText("Synced with server")).toBeInTheDocument();
      expect(screen.queryByText("Saved on device")).not.toBeInTheDocument();
      expect(screen.queryByText("Personal Deck")).not.toBeInTheDocument();
      expect(readFlashcardStore("learner-b").progress).toEqual({});
      const secondSignal = vi.mocked(getFlashcardWorkspace).mock.calls[1]![0];
      unmount();
      expect(secondSignal?.aborted).toBe(true);
    },
  );

  it("clears stale authenticated local progress when remote progress is empty", async () => {
    const pending = deferred<FlashcardWorkspaceApiResponse>();
    writeFlashcardStore(
      {
        progress: { [sampleCard.id]: staleProgress, deleted: staleProgress },
        customDecks: [],
      },
      "learner-a",
    );
    vi.mocked(getFlashcardWorkspace).mockReturnValue(pending.promise);
    renderWorkspace("learner-a", sampleDeck.slug);
    await screen.findByRole("button", { name: "Remove star" });
    await act(async () =>
      pending.resolve({ ...workspace, decks: [sampleDeck] }),
    );
    expect(readFlashcardStore("learner-a").progress).toEqual({});
    expect(
      screen.getByRole("button", { name: "Star important card" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("preserves guest progress when the public workspace has no progress", async () => {
    const progress = { [sampleCard.id]: staleProgress };
    writeFlashcardStore({ progress, customDecks: [] }, null);
    vi.mocked(getFlashcardWorkspace).mockResolvedValue({
      ...workspace,
      decks: [sampleDeck],
    });
    renderWorkspace(null, sampleDeck.slug);
    await screen.findByRole("button", { name: "Remove star" });
    expect(readFlashcardStore(null).progress).toEqual(progress);
  });

  it("resets server decks, match records, and sync mode when identity changes without remounting", async () => {
    const pending = deferred<FlashcardWorkspaceApiResponse>();
    vi.mocked(getFlashcardWorkspace)
      .mockResolvedValueOnce({
        ...workspace,
        decks: [{ ...sampleDeck, title: "Private Server Deck" }],
        matchRecords: {
          [sampleDeck.id]: {
            bestTimeMs: 1234,
            bestCombo: 6,
            playCount: 1,
            updatedAt: "2026-11-25T00:00:00Z",
          },
        },
      })
      .mockReturnValueOnce(pending.promise);
    const { rerender } = renderWorkspace("learner-a", sampleDeck.slug);
    await screen.findByRole("heading", { name: "Private Server Deck" });
    fireEvent.click(screen.getByRole("tab", { name: "Speed Match" }));
    expect(screen.getByText(/Best:/)).toBeInTheDocument();
    rerender(
      <FlashcardsWorkspace
        userId="learner-b"
        initialDeckSlug={sampleDeck.slug}
      />,
    );
    await waitFor(() => expect(getFlashcardWorkspace).toHaveBeenCalledTimes(2));
    expect(
      screen.queryByRole("heading", { name: "Private Server Deck" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Best:/)).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "All Flashcard Decks" }),
    );
    expect(screen.queryByText("Synced with server")).not.toBeInTheDocument();
    await act(async () => pending.reject(new Error("Offline")));
    expect(screen.getByText("Saved on device")).toBeInTheDocument();
  });

  it("does not add duplicate deck history entries on rapid repeat navigation", async () => {
    vi.mocked(getFlashcardWorkspace).mockResolvedValue(workspace);
    renderWorkspace();
    await screen.findByText("Synced with server");
    const pushState = vi.spyOn(window.history, "pushState");
    const start = screen.getByRole("button", { name: "Start studying →" });
    act(() => {
      fireEvent.click(start);
      fireEvent.click(start);
    });
    expect(pushState).toHaveBeenCalledTimes(1);
    expect(new URL(window.location.href).searchParams.get("deck")).toBe(
      remoteDeck.slug,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "All Flashcard Decks" }),
    );
    expect(pushState).toHaveBeenCalledTimes(2);
    expect(new URL(window.location.href).searchParams.get("deck")).toBeNull();
  });
});

describe("flashcards workspace optimistic progress", () => {
  it("preserves edits made while the authenticated workspace is still loading", async () => {
    const pendingWorkspace = deferred<FlashcardWorkspaceApiResponse>();
    const pendingProgress = deferred<CardProgressRecord>();
    vi.mocked(getFlashcardWorkspace).mockReturnValue(pendingWorkspace.promise);
    vi.mocked(upsertFlashcardProgressApi).mockReturnValue(
      pendingProgress.promise,
    );
    renderWorkspace("learner-a", sampleDeck.slug);
    await waitFor(() => expect(getFlashcardWorkspace).toHaveBeenCalledTimes(1));
    fireEvent.click(
      screen.getByRole("button", { name: "Star important card" }),
    );
    await act(async () =>
      pendingWorkspace.resolve({ ...workspace, decks: [sampleDeck] }),
    );
    expect(
      readFlashcardStore("learner-a").progress[sampleCard.id],
    ).toMatchObject({ status: "new", starred: true });
    expect(screen.getByRole("button", { name: "Remove star" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const saved: CardProgressRecord = {
      ...staleProgress,
      status: "new",
      reviewCount: 0,
    };
    await act(async () => pendingProgress.resolve(saved));
    expect(readFlashcardStore("learner-a").progress[sampleCard.id]).toEqual(
      saved,
    );
  });

  it("does not resurrect reset progress when an earlier save resolves", async () => {
    const pending = deferred<CardProgressRecord>();
    vi.mocked(getFlashcardWorkspace).mockResolvedValue(workspace);
    vi.mocked(upsertFlashcardProgressApi).mockReturnValue(pending.promise);
    renderWorkspace("learner-a", remoteDeck.slug);
    await screen.findByRole("heading", { name: "Personal Deck" });
    fireEvent.click(screen.getByRole("button", { name: /Mastered.*Key 3/ }));
    fireEvent.click(screen.getByRole("button", { name: "Reset progress" }));
    expect(resetFlashcardDeckProgressApi).toHaveBeenCalledWith(remoteDeck.id);
    expect(readFlashcardStore("learner-a").progress).toEqual({});
    await act(async () => pending.resolve(staleProgress));
    expect(readFlashcardStore("learner-a").progress).toEqual({});
  });

  it.each([
    { firstAction: "star", responseOrder: "older-first" },
    { firstAction: "star", responseOrder: "newer-first" },
    { firstAction: "rate", responseOrder: "older-first" },
    { firstAction: "rate", responseOrder: "newer-first" },
  ] as const)(
    "preserves Star + Rate when $firstAction is first and responses resolve $responseOrder",
    async ({ firstAction, responseOrder }) => {
      const older = deferred<CardProgressRecord>();
      const newer = deferred<CardProgressRecord>();
      vi.mocked(getFlashcardWorkspace).mockResolvedValue(workspace);
      vi.mocked(upsertFlashcardProgressApi)
        .mockReturnValueOnce(older.promise)
        .mockReturnValueOnce(newer.promise);
      renderWorkspace("learner-a", remoteDeck.slug);
      await screen.findByRole("heading", { name: "Personal Deck" });
      const star = screen.getByRole("button", { name: "Star important card" });
      const rate = screen.getByRole("button", { name: /Mastered.*Key 3/ });
      act(() => {
        fireEvent.click(firstAction === "star" ? star : rate);
        fireEvent.click(firstAction === "star" ? rate : star);
      });
      expect(upsertFlashcardProgressApi).toHaveBeenNthCalledWith(
        1,
        sampleCard.id,
        firstAction === "star" ? "new" : "mastered",
        firstAction === "star",
      );
      expect(upsertFlashcardProgressApi).toHaveBeenNthCalledWith(
        2,
        sampleCard.id,
        "mastered",
        true,
      );
      expect(
        readFlashcardStore("learner-a").progress[sampleCard.id],
      ).toMatchObject({ status: "mastered", starred: true, reviewCount: 1 });
      const olderSaved: CardProgressRecord = {
        ...staleProgress,
        status: firstAction === "star" ? "new" : "mastered",
        starred: firstAction === "star",
        reviewCount: 1,
      };
      const newerSaved: CardProgressRecord = {
        ...staleProgress,
        reviewCount: 2,
      };
      if (responseOrder === "older-first") {
        await act(async () => older.resolve(olderSaved));
        expect(
          readFlashcardStore("learner-a").progress[sampleCard.id],
        ).toMatchObject({ status: "mastered", starred: true, reviewCount: 1 });
        await act(async () => newer.resolve(newerSaved));
      } else {
        await act(async () => newer.resolve(newerSaved));
        await act(async () => older.resolve(olderSaved));
      }
      fireEvent.click(
        screen.getByRole("button", { name: "Study again from start" }),
      );
      expect(readFlashcardStore("learner-a").progress[sampleCard.id]).toEqual(
        newerSaved,
      );
      expect(
        screen.getByRole("button", { name: "Remove star" }),
      ).toHaveAttribute("aria-pressed", "true");
    },
  );

  it("handles two Star toggles before React commits without stale payloads or late rollback", async () => {
    const older = deferred<CardProgressRecord>();
    const newer = deferred<CardProgressRecord>();
    vi.mocked(getFlashcardWorkspace).mockResolvedValue(workspace);
    vi.mocked(upsertFlashcardProgressApi)
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise);
    renderWorkspace("learner-a", remoteDeck.slug);
    await screen.findByRole("heading", { name: "Personal Deck" });
    const star = screen.getByRole("button", { name: "Star important card" });
    act(() => {
      fireEvent.click(star);
      fireEvent.click(star);
    });
    expect(upsertFlashcardProgressApi).toHaveBeenNthCalledWith(
      1,
      sampleCard.id,
      "new",
      true,
    );
    expect(upsertFlashcardProgressApi).toHaveBeenNthCalledWith(
      2,
      sampleCard.id,
      "new",
      false,
    );
    const saved: CardProgressRecord = {
      ...staleProgress,
      status: "new",
      starred: false,
      reviewCount: 0,
    };
    await act(async () => newer.resolve(saved));
    await act(async () => older.resolve({ ...saved, starred: true }));
    expect(readFlashcardStore("learner-a").progress[sampleCard.id]).toEqual(
      saved,
    );
    expect(
      screen.getByRole("button", { name: "Star important card" }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});
