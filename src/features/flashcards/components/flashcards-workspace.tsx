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
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  focusRing,
  primaryAction,
  secondaryAction,
} from "@/shared/components/practice/styles";
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
}: {
  initialDeckSlug: string | null;
}) {
  const [store, setStore] = useState<FlashcardStoreState>(
    EMPTY_FLASHCARD_STORE,
  );
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

  useEffect(() => {
    const localState = readFlashcardStore();
    setStore(localState);
    setHydrated(true);

    let cancelled = false;
    void (async () => {
      try {
        const remote = await getFlashcardWorkspace();
        if (cancelled) return;
        if (remote.decks.length > 0) {
          setServerDecks(remote.decks);
        }
        if (Object.keys(remote.matchRecords).length > 0) {
          setMatchRecords(remote.matchRecords);
        }
        if (Object.keys(remote.progress).length > 0) {
          setStore((prev) => ({
            ...prev,
            progress: { ...prev.progress, ...remote.progress },
          }));
        }
        setSyncMode("synced");
      } catch {
        if (!cancelled) {
          setSyncMode("local");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const persistStore = useCallback(
    (updater: (prev: FlashcardStoreState) => FlashcardStoreState) => {
      setStore((prev) => {
        const next = updater(prev);
        writeFlashcardStore(next);
        return next;
      });
    },
    [],
  );

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

  const syncDeckUrl = (slug: string | null) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (slug) {
      url.searchParams.set("deck", slug);
    } else {
      url.searchParams.delete("deck");
    }
    window.history.replaceState({}, "", url.toString());
  };

  const openDeck = (slug: string) => {
    setSelectedSlug(slug);
    setStudyMode("flip");
    syncDeckUrl(slug);
  };

  const closeDeck = () => {
    setSelectedSlug(null);
    syncDeckUrl(null);
  };

  const handleRateCard = useCallback(
    (cardId: string, status: CardMastery) => {
      const currentStarred = store.progress[cardId]?.starred ?? false;
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

      if (isServerGuid(cardId)) {
        void upsertFlashcardProgressApi(cardId, status, currentStarred)
          .then((saved) => {
            setStore((prev) => ({
              ...prev,
              progress: { ...prev.progress, [cardId]: saved },
            }));
          })
          .catch(() => {
            // Keep optimistic localStorage state for guests or offline sessions.
          });
      }
    },
    [persistStore, store.progress],
  );

  const handleToggleStar = useCallback(
    (cardId: string) => {
      const currentStatus = store.progress[cardId]?.status ?? "new";
      const nextStarred = !(store.progress[cardId]?.starred ?? false);

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

      if (isServerGuid(cardId)) {
        void upsertFlashcardProgressApi(cardId, currentStatus, nextStarred)
          .then((saved) => {
            setStore((prev) => ({
              ...prev,
              progress: { ...prev.progress, [cardId]: saved },
            }));
          })
          .catch(() => {
            // Keep optimistic localStorage state for guests or offline sessions.
          });
      }
    },
    [persistStore, store.progress],
  );

  const handleCreateDeck = useCallback(
    (deck: FlashcardDeck) => {
      void createFlashcardDeckApi({
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
      })
        .then((created) => {
          setServerDecks((prev) => (prev ? [created, ...prev] : [created]));
          setSyncMode("synced");
          openDeck(created.slug);
        })
        .catch(() => {
          persistStore((prev) => ({
            ...prev,
            customDecks: [deck, ...prev.customDecks],
          }));
          openDeck(deck.slug);
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persistStore],
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
        try {
          const createdCard = await addFlashcardCardApi(deck.id, payload);
          setServerDecks((prev) =>
            prev
              ? prev.map((item) =>
                  item.id === deck.id ? appendCard(item, createdCard) : item,
                )
              : prev,
          );
          return;
        } catch {
          // Fall back to local persistence if offline or unauthenticated.
        }
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
        toeicPart: payload.toeicPart ?? "Từ vựng cá nhân",
        level: payload.level ?? "B2",
      };

      persistStore((prev) => ({
        ...prev,
        customDecks: prev.customDecks.map((item) =>
          item.id === deck.id ? appendCard(item, localCard) : item,
        ),
      }));
      setServerDecks((prev) =>
        prev
          ? prev.map((item) =>
              item.id === deck.id ? appendCard(item, localCard) : item,
            )
          : prev,
      );
    },
    [persistStore],
  );

  const handleDeleteCustomDeck = useCallback(
    (deckId: string) => {
      persistStore((prev) => ({
        ...prev,
        customDecks: prev.customDecks.filter((deck) => deck.id !== deckId),
      }));
      setServerDecks((prev) =>
        prev ? prev.filter((deck) => deck.id !== deckId) : prev,
      );
      if (activeDeck?.id === deckId) {
        closeDeck();
      }
      if (isServerGuid(deckId)) {
        void deleteFlashcardDeckApi(deckId).catch(() => {
          // Already removed locally.
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeDeck?.id, persistStore],
  );

  const handleRecordMatchRun = useCallback(
    (deckId: string, elapsedMs: number, maxCombo: number) => {
      if (!isServerGuid(deckId)) return;
      void recordFlashcardMatchApi(deckId, elapsedMs, maxCombo)
        .then((saved) => {
          setMatchRecords((prev) => ({ ...prev, [deckId]: saved }));
        })
        .catch(() => {
          // Keep localStorage best time fallback for guests or offline sessions.
        });
    },
    [],
  );

  const handleResetDeckProgress = useCallback(
    (deck: FlashcardDeck) => {
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
      if (isServerGuid(deck.id)) {
        void resetFlashcardDeckProgressApi(deck.id).catch(() => {
          // Already reset locally.
        });
      }
    },
    [persistStore],
  );

  if (activeDeck) {
    const deckSummary = summarizeDeckProgress(activeDeck.cards, store.progress);
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#ece9e5] pb-5">
          <div className="min-w-0 space-y-2">
            <button
              className={`inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-[#5f5953] transition hover:text-[#df5a28] ${focusRing}`}
              onClick={closeDeck}
              type="button"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Tất cả bộ Flashcard
            </button>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-[#2b2724] sm:text-3xl">
                {activeDeck.title}
              </h1>
              <span className="sp-chip sp-chip-orange">
                {FLASHCARD_CATEGORY_LABELS[activeDeck.category]}
              </span>
            </div>
            <p className="max-w-2xl text-sm text-[#5f5953]">
              {activeDeck.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-[#ece9e5] bg-[#faf7f5] px-4 py-2.5 text-xs">
              <div>
                <span className="text-[#5f5953]">Đã thuộc</span>
                <p className="sp-mono text-base font-bold text-[#3f7a52]">
                  {deckSummary.mastered}/{deckSummary.total}
                </p>
              </div>
              <div className="h-7 w-px bg-[#dacfc5]" />
              <div>
                <span className="text-[#5f5953]">Cần ôn</span>
                <p className="sp-mono text-base font-bold text-[#a16207]">
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
                Thêm từ mới
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
                Đặt lại tiến độ
              </button>
            )}
          </div>
        </div>

        {/* Mode switcher */}
        <div
          aria-label="Chế độ học bộ thẻ"
          className="inline-flex flex-wrap gap-1 rounded-xl border border-[#ece9e5] bg-[#f4f1ee] p-1"
          role="tablist"
        >
          {(
            [
              { key: "flip", label: "Lật thẻ 3D", icon: Layers },
              { key: "quiz", label: "Trắc nghiệm nhanh", icon: HelpCircle },
              { key: "match", label: "Ghép cặp tốc độ", icon: Grid2x2Check },
              {
                key: "list",
                label: `Danh sách (${activeDeck.cards.length})`,
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
                    ? "bg-white text-[#df5a28] shadow-xs"
                    : "text-[#5f5953] hover:text-[#2b2724]"
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
    <div className="space-y-8">
      {/* Header & progress summary */}
      <section className="flex flex-wrap items-end justify-between gap-6 border-b border-[#ece9e5] pb-7">
        <div className="max-w-2xl space-y-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-[#2b2724] sm:text-4xl">
              Flashcards Từ Vựng TOEIC
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
                    Đã kết nối máy chủ
                  </>
                ) : (
                  <>
                    <HardDrive aria-hidden="true" className="size-3.5" />
                    Lưu trên thiết bị
                  </>
                )}
              </span>
            )}
          </div>
          <p className="text-[15px] leading-relaxed text-[#5f5953]">
            Ôn nhanh từ vựng trọng tâm theo chủ đề công sở TOEIC bằng thẻ lật
            3D, phát âm chuẩn, ghép cặp tốc độ và trắc nghiệm củng cố. Tiến độ
            được tự động đồng bộ khi bạn đăng nhập.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-4 rounded-2xl border border-[#ece9e5] bg-[#fdf7ed] px-5 py-3">
            <div>
              <p className="text-xs font-medium text-[#5f5953]">Đã thuộc</p>
              <p className="sp-mono text-xl font-bold text-[#3f7a52]">
                {hydrated ? overallSummary.mastered : 0}
                <span className="text-sm font-normal text-[#948d86]">
                  /{overallSummary.total}
                </span>
              </p>
            </div>
            <div className="h-8 w-px bg-[#e9c6a4]" />
            <div>
              <p className="text-xs font-medium text-[#5f5953]">Cần ôn lại</p>
              <p className="sp-mono text-xl font-bold text-[#a16207]">
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
            Tạo bộ thẻ mới
          </button>
        </div>
      </section>

      {/* Search & Category filters */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <fieldset className="flex flex-wrap gap-1.5 border-0 p-0">
            <legend className="sr-only">Lọc bộ thẻ theo chủ đề</legend>
            {CATEGORY_FILTER_ORDER.map((category) => {
              const active = categoryFilter === category;
              const label =
                category === "all"
                  ? "Tất cả chủ đề"
                  : FLASHCARD_CATEGORY_LABELS[category];
              return (
                <button
                  aria-pressed={active}
                  className={`min-h-9 cursor-pointer rounded-full border px-3.5 text-xs font-semibold transition ${focusRing} ${
                    active
                      ? "border-[#df5a28] bg-[#fff1ea] text-[#df5a28]"
                      : "border-[#ece9e5] bg-white text-[#5f5953] hover:border-[#dacfc5] hover:text-[#2b2724]"
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

          <div className="relative w-full sm:w-72">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#948d86]"
            />
            <input
              aria-label="Tìm bộ thẻ hoặc từ vựng"
              className="sp-input min-h-10 pl-10"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm chủ đề hoặc từ vựng..."
              type="search"
              value={searchQuery}
            />
          </div>
        </div>

        {/* Deck grid */}
        {filteredDecks.length === 0 ? (
          <div className="rounded-2xl border border-[#ece9e5] bg-[#faf7f5] px-6 py-12 text-center">
            <p className="text-base font-semibold text-[#2b2724]">
              {categoryFilter === "custom"
                ? "Bạn chưa tạo bộ thẻ cá nhân nào"
                : "Không tìm thấy bộ thẻ phù hợp"}
            </p>
            <p className="mt-1.5 text-sm text-[#5f5953]">
              {categoryFilter === "custom"
                ? "Tạo bộ thẻ đầu tiên để lưu các từ vựng TOEIC bạn hay quên."
                : "Thử xóa từ khóa tìm kiếm hoặc chọn chủ đề khác."}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              {categoryFilter === "custom" ? (
                <button
                  className={primaryAction}
                  onClick={() => setCreateDialogOpen(true)}
                  type="button"
                >
                  <Plus aria-hidden="true" className="size-4" />
                  Tạo bộ thẻ đầu tiên
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
                  Xem tất cả bộ thẻ
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
                  className="group flex flex-col justify-between rounded-[20px] border border-[#ece9e5] bg-white p-6 transition hover:border-[#e9c6a4] hover:shadow-[0_12px_28px_-18px_rgb(204_47_32/0.25)]"
                  key={deck.id}
                >
                  <div>
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
                            aria-label={`Xóa bộ thẻ ${deck.title}`}
                            className={`grid size-7 cursor-pointer place-items-center rounded-md text-[#948d86] transition hover:bg-[#f6e1e1] hover:text-[#bd2a2a] ${focusRing}`}
                            onClick={() => handleDeleteCustomDeck(deck.id)}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h2 className="mt-4 text-lg font-bold leading-snug text-[#2b2724] group-hover:text-[#df5a28]">
                      {deck.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#5f5953]">
                      {deck.description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-[#5f5953]">
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen aria-hidden="true" className="size-3.5" />
                        {summary.total} thẻ
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock aria-hidden="true" className="size-3.5" />~
                        {deck.estimatedMinutes} phút
                      </span>
                      {summary.mastered > 0 && (
                        <span className="inline-flex items-center gap-1 text-[#3f7a52]">
                          <CheckCircle2
                            aria-hidden="true"
                            className="size-3.5"
                          />
                          {summary.mastered} đã thuộc
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 border-t border-[#ece9e5] pt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#5f5953]">
                        Tiến độ ghi nhớ
                      </span>
                      <span className="sp-mono font-bold text-[#2b2724]">
                        {summary.completionPercent}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e9e4df]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#cc2f20] to-[#e36a22] transition-[width] duration-300"
                        style={{ width: `${summary.completionPercent}%` }}
                      />
                    </div>
                    <button
                      className={`mt-1 inline-flex min-h-10 w-full cursor-pointer items-center justify-center rounded-xl border border-[#dacfc5] bg-[#faf7f5] px-4 text-sm font-bold text-[#2b2724] transition group-hover:border-[#df5a28] group-hover:bg-[#fff1ea] group-hover:text-[#df5a28] ${focusRing}`}
                      onClick={() => openDeck(deck.slug)}
                      type="button"
                    >
                      {summary.mastered > 0 || summary.review > 0
                        ? "Tiếp tục ôn tập →"
                        : "Bắt đầu học →"}
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
    </div>
  );
}
