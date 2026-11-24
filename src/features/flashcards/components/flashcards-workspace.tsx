"use client";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Cloud,
  Grid2x2Check,
  HardDrive,
  HelpCircle,
  Layers,
  List,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  focusRing,
  primaryAction,
  secondaryAction,
} from "@/shared/components/practice/styles";
import { ConfirmDialog } from "@/shared/components/ui/dialog";
import {
  addFlashcardCardApi,
  createFlashcardDeckApi,
  deleteFlashcardDeckApi,
  getFlashcardWorkspace,
  isServerGuid,
  recordFlashcardMatchApi,
  resetFlashcardDeckProgressApi,
  upsertFlashcardProgressApi,
  type CreateFlashcardCardPayload,
} from "../api";
import {
  BUILTIN_FLASHCARD_DECKS,
  FLASHCARD_CATEGORY_LABELS,
} from "../decks-data";
import {
  EMPTY_FLASHCARD_STORE,
  readFlashcardStore,
  summarizeDeckProgress,
  writeFlashcardStore,
} from "../storage";
import type {
  CardMastery,
  FlashcardCategory,
  FlashcardDeck,
  FlashcardItem,
  FlashcardStoreState,
  MatchRecord,
  StudyMode,
} from "../types";
import { CardAddDialog } from "./card-add-dialog";
import { DeckCreateDialog } from "./deck-create-dialog";
import { FlashcardMatchGame } from "./flashcard-match-game";
import { FlashcardQuizMode } from "./flashcard-quiz-mode";
import { FlashcardStudyStage } from "./flashcard-study-stage";
import { FlashcardWordList } from "./flashcard-word-list";

const CATEGORY_FILTER_ORDER: readonly ("all" | FlashcardCategory)[] = [
  "all",
  "office",
  "contracts",
  "finance",
  "travel",
  "marketing",
  "hr",
  "custom",
];

type SyncMode = "loading" | "synced" | "local";

export function FlashcardsWorkspace({
  initialDeckSlug,
  userId,
}: {
  initialDeckSlug: string | null;
  userId: string | null;
}) {
  const [store, setStore] = useState<FlashcardStoreState>(
    EMPTY_FLASHCARD_STORE,
  );
  const storeRef = useRef(store);
  const progressRef = useRef(store.progress);
  const progressRequestsRef = useRef(new Map<string, symbol>());

  const [serverDecks, setServerDecks] = useState<FlashcardDeck[] | null>(null);
  const [matchRecords, setMatchRecords] = useState<Record<string, MatchRecord>>(
    {},
  );
  const [syncMode, setSyncMode] = useState<SyncMode>("loading");
  const [hydrated, setHydrated] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    initialDeckSlug,
  );
  const [studyMode, setStudyMode] = useState<StudyMode>("flip");
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | FlashcardCategory
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addCardDialogOpen, setAddCardDialogOpen] = useState(false);
  const [pendingDeleteDeck, setPendingDeleteDeck] =
    useState<FlashcardDeck | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null);

  const persistStore = useCallback(
    (updater: (prev: FlashcardStoreState) => FlashcardStoreState) => {
      const next = updater(storeRef.current);
      storeRef.current = next;
      progressRef.current = next.progress;
      setStore(next);
      writeFlashcardStore(next, userId);
    },
    [userId],
  );

  useEffect(() => {
    const controller = new AbortController();
    const progressRequests = progressRequestsRef.current;
    progressRequests.clear();
    void (async () => {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      const localState = readFlashcardStore(userId);
      persistStore(() => localState);
      setServerDecks(null);
      setMatchRecords({});
      setSyncMode("loading");
      setHydrated(true);
      try {
        const remote = await getFlashcardWorkspace(controller.signal);
        if (controller.signal.aborted) return;
        setServerDecks(remote.decks);
        setMatchRecords(remote.matchRecords);
        persistStore((prev) => {
          const progress =
            userId === null
              ? { ...prev.progress, ...remote.progress }
              : { ...remote.progress };
          for (const cardId of progressRequests.keys()) {
            const current = prev.progress[cardId];
            if (current) progress[cardId] = current;
          }
          return { ...prev, progress };
        });
        setSyncMode("synced");
      } catch {
        if (!controller.signal.aborted) {
          setSyncMode("local");
        }
      }
    })();

    return () => {
      controller.abort();
      progressRequests.clear();
    };
  }, [persistStore, userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setSelectedSlug(params.get("deck"));
      setStudyMode("flip");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const allDecks = useMemo(() => {
    if (serverDecks && serverDecks.length > 0) {
      const serverSlugs = new Set(serverDecks.map((deck) => deck.slug));
      const localOnlyCustom = store.customDecks.filter(
        (deck) => !serverSlugs.has(deck.slug),
      );
      return [...localOnlyCustom, ...serverDecks];
    }
    return [...store.customDecks, ...BUILTIN_FLASHCARD_DECKS];
  }, [serverDecks, store.customDecks]);

  const allCardsPool = useMemo(
    () => allDecks.flatMap((deck) => deck.cards),
    [allDecks],
  );

  const activeDeck = useMemo(
    () => allDecks.find((deck) => deck.slug === selectedSlug) ?? null,
    [allDecks, selectedSlug],
  );

  const overallSummary = useMemo(
    () => summarizeDeckProgress(allCardsPool, store.progress),
    [allCardsPool, store.progress],
  );

  const filteredDecks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allDecks.filter((deck) => {
      if (categoryFilter !== "all" && deck.category !== categoryFilter) {
        return false;
      }
      if (!query) return true;
      const inTitle = deck.title.toLowerCase().includes(query);
      const inDesc = deck.description.toLowerCase().includes(query);
      const inCards = deck.cards.some(
        (card) =>
          card.term.toLowerCase().includes(query) ||
          card.meaningVi.toLowerCase().includes(query),
      );
      return inTitle || inDesc || inCards;
    });
  }, [allDecks, categoryFilter, searchQuery]);

  const syncDeckUrl = useCallback((slug: string | null) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("deck") === slug) return;
    if (slug) {
      url.searchParams.set("deck", slug);
    } else {
      url.searchParams.delete("deck");
    }
    window.history.pushState({ deck: slug }, "", url.toString());
  }, []);

  const openDeck = useCallback(
    (slug: string) => {
      setSelectedSlug(slug);
      setStudyMode("flip");
      syncDeckUrl(slug);
    },
    [syncDeckUrl],
  );

  const closeDeck = useCallback(() => {
    setSelectedSlug(null);
    syncDeckUrl(null);
  }, [syncDeckUrl]);

  const saveCardProgress = useCallback(
    (cardId: string, status: CardMastery, starred: boolean) => {
      if (!isServerGuid(cardId) || !userId) return;
      const request = Symbol();
      progressRequestsRef.current.set(cardId, request);
      void upsertFlashcardProgressApi(cardId, status, starred)
        .then((saved) => {
          if (progressRequestsRef.current.get(cardId) !== request) return;
          persistStore((prev) => ({
            ...prev,
            progress: { ...prev.progress, [cardId]: saved },
          }));
        })
        .catch(() => {});
    },
    [persistStore, userId],
  );

  const handleRateCard = useCallback(
    (cardId: string, status: CardMastery) => {
      const currentStarred = progressRef.current[cardId]?.starred ?? false;
      persistStore((prev) => {
        const current = prev.progress[cardId];
        return {
          ...prev,
          progress: {
            ...prev.progress,
            [cardId]: {
              status,
              starred: current?.starred ?? false,
              reviewCount: (current?.reviewCount ?? 0) + 1,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });

      saveCardProgress(cardId, status, currentStarred);
    },
    [persistStore, saveCardProgress],
  );

  const handleToggleStar = useCallback(
    (cardId: string) => {
      const currentStatus = progressRef.current[cardId]?.status ?? "new";
      const nextStarred = !(progressRef.current[cardId]?.starred ?? false);

      persistStore((prev) => {
        const current = prev.progress[cardId];
        return {
          ...prev,
          progress: {
            ...prev.progress,
            [cardId]: {
              status: current?.status ?? "new",
              starred: !(current?.starred ?? false),
              reviewCount: current?.reviewCount ?? 0,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });

      saveCardProgress(cardId, currentStatus, nextStarred);
    },
    [persistStore, saveCardProgress],
  );

  const handleCreateDeck = useCallback(
    async (deck: FlashcardDeck) => {
      if (userId) {
        const created = await createFlashcardDeckApi({
          title: deck.title,
          description: deck.description,
          cards: deck.cards.map((card) => ({
            term: card.term,
            phonetic: card.phonetic,
            partOfSpeech: card.partOfSpeech,
            meaningVi: card.meaningVi,
            exampleEn: card.exampleEn,
            exampleVi: card.exampleVi,
            collocations: [...card.collocations],
            toeicPart: card.toeicPart,
            level: card.level,
          })),
        });
        setServerDecks((prev) => (prev ? [created, ...prev] : [created]));
        setSyncMode("synced");
        openDeck(created.slug);
        return;
      }

      persistStore((prev) => ({
        ...prev,
        customDecks: [deck, ...prev.customDecks],
      }));
      openDeck(deck.slug);
    },
    [openDeck, persistStore, userId],
  );

  const handleAddCardToDeck = useCallback(
    async (deck: FlashcardDeck, payload: CreateFlashcardCardPayload) => {
      const appendCard = (
        targetDeck: FlashcardDeck,
        newCard: FlashcardItem,
      ) => ({
        ...targetDeck,
        estimatedMinutes: Math.max(
          2,
          Math.ceil((targetDeck.cards.length + 1) * 0.8),
        ),
        cards: [...targetDeck.cards, newCard],
      });

      if (isServerGuid(deck.id)) {
        const createdCard = await addFlashcardCardApi(deck.id, payload);
        setServerDecks((prev) =>
          prev
            ? prev.map((item) =>
                item.id === deck.id ? appendCard(item, createdCard) : item,
              )
            : prev,
        );
        return;
      }

      const localCard: FlashcardItem = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        term: payload.term,
        phonetic: payload.phonetic ?? "",
        partOfSpeech: payload.partOfSpeech ?? "noun",
        meaningVi: payload.meaningVi,
        exampleEn: payload.exampleEn ?? "",
        exampleVi: payload.exampleVi ?? "",
        collocations: payload.collocations ?? [],
        toeicPart: payload.toeicPart ?? "Personal Vocab",
        level: payload.level ?? "B2",
      };

      persistStore((prev) => ({
        ...prev,
        customDecks: prev.customDecks.map((item) =>
          item.id === deck.id ? appendCard(item, localCard) : item,
        ),
      }));
    },
    [persistStore],
  );

  const requestDeleteCustomDeck = useCallback(
    (deck: FlashcardDeck, trigger: HTMLButtonElement | null) => {
      deleteTriggerRef.current = trigger;
      setDeleteError(null);
      setPendingDeleteDeck(deck);
    },
    [],
  );

  const cancelDeleteCustomDeck = useCallback(() => {
    if (deleting) return;
    setPendingDeleteDeck(null);
    setDeleteError(null);
    window.requestAnimationFrame(() => {
      deleteTriggerRef.current?.focus();
    });
  }, [deleting]);

  const confirmDeleteCustomDeck = useCallback(async () => {
    if (!pendingDeleteDeck || deleting) return;
    const target = pendingDeleteDeck;
    setDeleting(true);
    setDeleteError(null);
    try {
      if (isServerGuid(target.id)) {
        await deleteFlashcardDeckApi(target.id);
      }
      persistStore((prev) => ({
        ...prev,
        customDecks: prev.customDecks.filter((deck) => deck.id !== target.id),
      }));
      setServerDecks((prev) =>
        prev ? prev.filter((deck) => deck.id !== target.id) : prev,
      );
      if (activeDeck?.id === target.id) {
        closeDeck();
      }
      setPendingDeleteDeck(null);
    } catch (cause) {
      setDeleteError(
        cause instanceof Error
          ? cause.message
          : "Could not delete this deck. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  }, [activeDeck, closeDeck, deleting, pendingDeleteDeck, persistStore]);

  const handleRecordMatchRun = useCallback(
    (deckId: string, elapsedMs: number, maxCombo: number) => {
      if (!isServerGuid(deckId) || !userId) return;
      void recordFlashcardMatchApi(deckId, elapsedMs, maxCombo)
        .then((saved) => {
          setMatchRecords((prev) => ({ ...prev, [deckId]: saved }));
        })
        .catch(() => {
          // Keep localStorage best time fallback for offline sessions.
        });
    },
    [userId],
  );

  const handleResetDeckProgress = useCallback(
    (deck: FlashcardDeck) => {
      for (const card of deck.cards) {
        progressRequestsRef.current.delete(card.id);
      }
      persistStore((prev) => {
        const nextProgress = { ...prev.progress };
        for (const card of deck.cards) {
          delete nextProgress[card.id];
        }
        return {
          ...prev,
          progress: nextProgress,
        };
      });
      if (isServerGuid(deck.id) && userId) {
        void resetFlashcardDeckProgressApi(deck.id).catch(() => {
          // Already reset locally.
        });
      }
    },
    [persistStore, userId],
  );

  if (activeDeck) {
    const deckSummary = summarizeDeckProgress(activeDeck.cards, store.progress);
    return (
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--tm-border)] pb-5">
          <div className="min-w-0 space-y-2">
            <button
              className={`inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-[var(--tm-ink-muted)] transition hover:text-[var(--tm-brand)] ${focusRing}`}
              onClick={closeDeck}
              type="button"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              All Flashcard Decks
            </button>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--tm-ink)] sm:text-3xl">
                {activeDeck.title}
              </h1>
              <span className="sp-chip sp-chip-orange">
                {FLASHCARD_CATEGORY_LABELS[activeDeck.category]}
              </span>
            </div>
            <p className="max-w-2xl text-sm text-[var(--tm-ink-muted)]">
              {activeDeck.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-[var(--tm-border)] bg-[var(--tm-page)] px-4 py-2.5 text-xs">
              <div>
                <span className="text-[var(--tm-ink-muted)]">Mastered</span>
                <p className="sp-mono text-base font-bold text-[var(--tm-success)]">
                  {deckSummary.mastered}/{deckSummary.total}
                </p>
              </div>
              <div className="h-7 w-px bg-[var(--tm-border-strong)]" />
              <div>
                <span className="text-[var(--tm-ink-muted)]">Needs review</span>
                <p className="sp-mono text-base font-bold text-[var(--tm-warning)]">
                  {deckSummary.review + deckSummary.learning}
                </p>
              </div>
            </div>

            {activeDeck.isCustom && (
              <button
                className={`${primaryAction} min-h-10 px-4 text-xs`}
                onClick={() => setAddCardDialogOpen(true)}
                type="button"
              >
                <Plus aria-hidden="true" className="size-4" strokeWidth={2.2} />
                Add new word
              </button>
            )}

            {deckSummary.mastered + deckSummary.review + deckSummary.learning >
              0 && (
              <button
                className={`${secondaryAction} min-h-10 px-3.5 text-xs`}
                onClick={() => handleResetDeckProgress(activeDeck)}
                type="button"
              >
                <RotateCcw aria-hidden="true" className="size-3.5" />
                Reset progress
              </button>
            )}
          </div>
        </div>

        {/* Mode switcher */}
        <div
          aria-label="Deck study modes"
          className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-[var(--tm-border)] bg-[var(--tm-surface-muted)] p-1"
          role="tablist"
        >
          {(
            [
              { key: "flip", label: "3D Flip Cards", icon: Layers },
              { key: "quiz", label: "Quick Quiz", icon: HelpCircle },
              { key: "match", label: "Speed Match", icon: Grid2x2Check },
              {
                key: "list",
                label: `Word List (${activeDeck.cards.length})`,
                icon: List,
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = studyMode === tab.key;
            return (
              <button
                aria-selected={active}
                className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${focusRing} ${
                  active
                    ? "bg-[var(--tm-surface)] text-[var(--tm-brand)] shadow-xs"
                    : "text-[var(--tm-ink-muted)] hover:text-[var(--tm-ink)]"
                }`}
                key={tab.key}
                onClick={() => setStudyMode(tab.key)}
                role="tab"
                type="button"
              >
                <Icon
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.75}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        {studyMode === "flip" && (
          <FlashcardStudyStage
            cards={activeDeck.cards}
            key={activeDeck.id}
            onRateCard={handleRateCard}
            onToggleStar={handleToggleStar}
            progress={store.progress}
          />
        )}

        {studyMode === "quiz" && (
          <FlashcardQuizMode
            cards={activeDeck.cards}
            distractorPool={allCardsPool}
            key={`${activeDeck.id}-quiz`}
            onRateCard={handleRateCard}
          />
        )}

        {studyMode === "match" && (
          <FlashcardMatchGame
            cards={activeDeck.cards}
            deckId={activeDeck.id}
            userId={userId}
            key={`${activeDeck.id}-match`}
            onCompleteRun={(elapsedMs, maxCombo) =>
              handleRecordMatchRun(activeDeck.id, elapsedMs, maxCombo)
            }
            onRateCard={handleRateCard}
            serverBestMs={matchRecords[activeDeck.id]?.bestTimeMs ?? null}
          />
        )}

        {studyMode === "list" && (
          <FlashcardWordList
            cards={activeDeck.cards}
            onRateCard={handleRateCard}
            onToggleStar={handleToggleStar}
            progress={store.progress}
          />
        )}

        {activeDeck.isCustom && (
          <CardAddDialog
            deckTitle={activeDeck.title}
            onAddCard={(payload) => handleAddCardToDeck(activeDeck, payload)}
            onOpenChange={setAddCardDialogOpen}
            open={addCardDialogOpen}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-8">
      {/* Header & progress summary */}
      <section className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--tm-border)] pb-7">
        <div className="min-w-0 max-w-2xl space-y-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--tm-ink)] sm:text-4xl">
              TOEIC Vocabulary Flashcards
            </h1>
            {syncMode !== "loading" && (
              <span
                className={
                  syncMode === "synced"
                    ? "sp-chip sp-chip-success"
                    : "sp-chip sp-chip-neutral"
                }
              >
                {syncMode === "synced" ? (
                  <>
                    <Cloud aria-hidden="true" className="size-3.5" />
                    Synced with server
                  </>
                ) : (
                  <>
                    <HardDrive aria-hidden="true" className="size-3.5" />
                    Saved on device
                  </>
                )}
              </span>
            )}
          </div>
          <p className="text-[15px] leading-relaxed text-[var(--tm-ink-muted)]">
            Review essential TOEIC workplace vocabulary by topic with 3D flip
            cards, clear pronunciation, speed matching, and quick reinforcement
            quizzes. Progress syncs automatically when you sign in.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-4 rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-brand-soft)] px-5 py-3">
            <div>
              <p className="text-xs font-medium text-[var(--tm-ink-muted)]">
                Mastered
              </p>
              <p className="sp-mono text-xl font-bold text-[var(--tm-success)]">
                {hydrated ? overallSummary.mastered : 0}
                <span className="text-sm font-normal text-[var(--tm-ink-muted)]">
                  /{overallSummary.total}
                </span>
              </p>
            </div>
            <div className="h-8 w-px bg-[#e9c6a4]" />
            <div>
              <p className="text-xs font-medium text-[var(--tm-ink-muted)]">
                Needs review
              </p>
              <p className="sp-mono text-xl font-bold text-[var(--tm-warning)]">
                {hydrated ? overallSummary.review + overallSummary.learning : 0}
              </p>
            </div>
          </div>

          <button
            className={primaryAction}
            onClick={() => setCreateDialogOpen(true)}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" strokeWidth={2.2} />
            Create new deck
          </button>
        </div>
      </section>

      {/* Search & Category filters */}
      <section className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <fieldset className="flex min-w-0 flex-wrap gap-1.5 border-0 p-0">
            <legend className="sr-only">Filter decks by category</legend>
            {CATEGORY_FILTER_ORDER.map((category) => {
              const active = categoryFilter === category;
              const label =
                category === "all"
                  ? "All categories"
                  : FLASHCARD_CATEGORY_LABELS[category];
              return (
                <button
                  aria-pressed={active}
                  className={`min-h-9 cursor-pointer rounded-full border px-3.5 text-xs font-semibold transition ${focusRing} ${
                    active
                      ? "border-[var(--tm-brand)] bg-[var(--tm-brand-soft)] text-[var(--tm-brand)]"
                      : "border-[var(--tm-border)] bg-[var(--tm-surface)] text-[var(--tm-ink-muted)] hover:border-[var(--tm-border-strong)] hover:text-[var(--tm-ink)]"
                  }`}
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </fieldset>

          <div className="relative w-full min-w-0 sm:w-72">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--tm-ink-muted)]"
            />
            <input
              aria-label="Search decks or vocabulary"
              className="sp-input min-h-10 pl-10"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics or vocabulary…"
              type="search"
              value={searchQuery}
            />
          </div>
        </div>

        {/* Deck grid */}
        {filteredDecks.length === 0 ? (
          <div className="rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-page)] px-6 py-12 text-center">
            <p className="text-base font-semibold text-[var(--tm-ink)]">
              {categoryFilter === "custom"
                ? "You haven't created any custom decks yet"
                : "No matching decks found"}
            </p>
            <p className="mt-1.5 text-sm text-[var(--tm-ink-muted)]">
              {categoryFilter === "custom"
                ? "Create your first deck to save TOEIC words you often forget."
                : "Try clearing your search query or choosing another category."}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              {categoryFilter === "custom" ? (
                <button
                  className={primaryAction}
                  onClick={() => setCreateDialogOpen(true)}
                  type="button"
                >
                  <Plus aria-hidden="true" className="size-4" />
                  Create your first deck
                </button>
              ) : (
                <button
                  className={secondaryAction}
                  onClick={() => {
                    setCategoryFilter("all");
                    setSearchQuery("");
                  }}
                  type="button"
                >
                  View all decks
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredDecks.map((deck) => {
              const summary = summarizeDeckProgress(
                deck.cards,
                hydrated ? store.progress : {},
              );
              return (
                <article
                  className="group flex min-w-0 flex-col justify-between rounded-[20px] border border-[var(--tm-border)] bg-[var(--tm-surface)] p-6 transition hover:border-[#e9c6a4] hover:shadow-[0_12px_28px_-18px_rgb(204_47_32/0.25)]"
                  key={deck.id}
                >
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="sp-chip sp-chip-orange">
                        {FLASHCARD_CATEGORY_LABELS[deck.category]}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="sp-chip sp-chip-neutral">
                          {deck.targetScore}
                        </span>
                        {deck.isCustom && (
                          <button
                            aria-label={`Delete deck ${deck.title}`}
                            className={`grid size-10 cursor-pointer place-items-center rounded-lg text-[var(--tm-ink-muted)] transition hover:bg-[var(--tm-danger-soft)] hover:text-[var(--tm-danger)] ${focusRing}`}
                            onClick={(event) =>
                              requestDeleteCustomDeck(deck, event.currentTarget)
                            }
                            type="button"
                          >
                            <Trash2 aria-hidden="true" className="size-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h2 className="mt-4 text-lg font-bold leading-snug text-[var(--tm-ink)] group-hover:text-[var(--tm-brand)]">
                      {deck.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--tm-ink-muted)]">
                      {deck.description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-[var(--tm-ink-muted)]">
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen aria-hidden="true" className="size-3.5" />
                        {summary.total} cards
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock aria-hidden="true" className="size-3.5" />~
                        {deck.estimatedMinutes} min
                      </span>
                      {summary.mastered > 0 && (
                        <span className="inline-flex items-center gap-1 text-[var(--tm-success)]">
                          <CheckCircle2
                            aria-hidden="true"
                            className="size-3.5"
                          />
                          {summary.mastered} mastered
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 border-t border-[var(--tm-border)] pt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--tm-ink-muted)]">
                        Mastery progress
                      </span>
                      <span className="sp-mono font-bold text-[var(--tm-ink)]">
                        {summary.completionPercent}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--tm-border)]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#cc2f20] to-[#e36a22] transition-[width] duration-300"
                        style={{ width: `${summary.completionPercent}%` }}
                      />
                    </div>
                    <button
                      className={`mt-1 inline-flex min-h-10 w-full cursor-pointer items-center justify-center rounded-xl border border-[var(--tm-border-strong)] bg-[var(--tm-page)] px-4 text-sm font-bold text-[var(--tm-ink)] transition group-hover:border-[var(--tm-brand)] group-hover:bg-[var(--tm-brand-soft)] group-hover:text-[var(--tm-brand)] ${focusRing}`}
                      onClick={() => openDeck(deck.slug)}
                      type="button"
                    >
                      {summary.mastered > 0 || summary.review > 0
                        ? "Continue studying →"
                        : "Start studying →"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <DeckCreateDialog
        onCreateDeck={handleCreateDeck}
        onOpenChange={setCreateDialogOpen}
        open={createDialogOpen}
      />

      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel={deleting ? "Deleting…" : "Delete deck"}
        destructive
        id="delete-flashcard-deck-title"
        onCancel={cancelDeleteCustomDeck}
        onConfirm={() => void confirmDeleteCustomDeck()}
        open={pendingDeleteDeck !== null}
        title="Delete custom deck?"
      >
        <p>
          Are you sure you want to permanently delete{" "}
          <strong className="font-semibold text-[var(--tm-ink)]">
            {pendingDeleteDeck?.title}
          </strong>
          ? All cards in this deck will be removed.
        </p>
        {deleteError ? (
          <p
            className="mt-3 rounded-lg border border-[var(--tm-danger)]/35 bg-[var(--tm-danger-soft)] px-3 py-2 text-xs font-medium text-[var(--tm-danger)]"
            role="alert"
          >
            {deleteError}
          </p>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
