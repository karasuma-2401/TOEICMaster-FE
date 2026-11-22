"use client";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  Star,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWordSpeech } from "@/features/pronunciation/hooks/use-word-speech";
import {
  focusRing,
  primaryAction,
  secondaryAction,
} from "@/shared/components/practice/styles";
import {
  filterDeckCards,
  getCardStatus,
  isCardStarred,
  shuffleCards,
} from "../storage";
import type {
  CardFilter,
  CardMastery,
  CardProgressRecord,
  FlashcardItem,
} from "../types";

const FILTER_OPTIONS: readonly { key: CardFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "unmastered", label: "Chưa thuộc" },
  { key: "review", label: "Cần ôn" },
  { key: "mastered", label: "Đã thuộc" },
  { key: "starred", label: "Đánh dấu" },
];

const STATUS_META: Record<CardMastery, { label: string; chipClass: string }> = {
  new: { label: "Chưa học", chipClass: "sp-chip sp-chip-neutral" },
  learning: { label: "Chưa nhớ", chipClass: "sp-chip sp-chip-danger" },
  review: { label: "Cần ôn thêm", chipClass: "sp-chip sp-chip-warning" },
  mastered: { label: "Đã thuộc", chipClass: "sp-chip sp-chip-success" },
};

export function FlashcardStudyStage({
  cards,
  progress,
  onRateCard,
  onToggleStar,
}: {
  cards: readonly FlashcardItem[];
  progress: Record<string, CardProgressRecord>;
  onRateCard: (cardId: string, status: CardMastery) => void;
  onToggleStar: (cardId: string) => void;
}) {
  const { supported: speechSupported, speak } = useWordSpeech();
  const [filter, setFilter] = useState<CardFilter>("all");
  const [isShuffled, setIsShuffled] = useState(false);
  const [orderedIds, setOrderedIds] = useState<string[]>(() =>
    cards.map((card) => card.id),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    learning: 0,
    review: 0,
    mastered: 0,
  });

  const filteredCards = useMemo(
    () => filterDeckCards(cards, progress, filter),
    [cards, progress, filter],
  );

  const studyCards = useMemo(() => {
    const byId = new Map(filteredCards.map((card) => [card.id, card]));
    if (!isShuffled) return filteredCards;
    const ordered: FlashcardItem[] = [];
    for (const id of orderedIds) {
      const found = byId.get(id);
      if (found) ordered.push(found);
    }
    for (const card of filteredCards) {
      if (!ordered.some((item) => item.id === card.id)) {
        ordered.push(card);
      }
    }
    return ordered;
  }, [filteredCards, isShuffled, orderedIds]);

  const safeIndex =
    studyCards.length === 0 ? 0 : Math.min(currentIndex, studyCards.length - 1);
  const activeCard = studyCards[safeIndex] ?? null;

  const handleFilterChange = (nextFilter: CardFilter) => {
    setFilter(nextFilter);
    setCurrentIndex(0);
    setFlipped(false);
    setSessionDone(false);
  };

  const handleToggleShuffle = () => {
    if (isShuffled) {
      setIsShuffled(false);
      setOrderedIds(cards.map((card) => card.id));
    } else {
      setIsShuffled(true);
      setOrderedIds(shuffleCards(cards).map((card) => card.id));
    }
    setCurrentIndex(0);
    setFlipped(false);
    setSessionDone(false);
  };

  const goPrev = useCallback(() => {
    if (studyCards.length === 0) return;
    setSessionDone(false);
    setFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : studyCards.length - 1));
  }, [studyCards.length]);

  const goNext = useCallback(() => {
    if (studyCards.length === 0) return;
    setFlipped(false);
    if (safeIndex + 1 >= studyCards.length) {
      setSessionDone(true);
    } else {
      setCurrentIndex(safeIndex + 1);
    }
  }, [safeIndex, studyCards.length]);

  const handleRate = useCallback(
    (status: CardMastery) => {
      if (!activeCard) return;
      onRateCard(activeCard.id, status);
      setSessionStats((prev) => ({
        learning: prev.learning + (status === "learning" ? 1 : 0),
        review: prev.review + (status === "review" ? 1 : 0),
        mastered: prev.mastered + (status === "mastered" ? 1 : 0),
      }));
      setFlipped(false);
      if (safeIndex + 1 >= studyCards.length) {
        setSessionDone(true);
      } else {
        setCurrentIndex(safeIndex + 1);
      }
    },
    [activeCard, onRateCard, safeIndex, studyCards.length],
  );

  const restartSession = (nextFilter?: CardFilter) => {
    if (nextFilter) setFilter(nextFilter);
    setCurrentIndex(0);
    setFlipped(false);
    setSessionDone(false);
    setSessionStats({ learning: 0, review: 0, mastered: 0 });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (sessionDone || !activeCard) return;

      if (event.code === "Space") {
        event.preventDefault();
        setFlipped((prev) => !prev);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "1") {
        event.preventDefault();
        handleRate("learning");
      } else if (event.key === "2") {
        event.preventDefault();
        handleRate("review");
      } else if (event.key === "3") {
        event.preventDefault();
        handleRate("mastered");
      } else if ((event.key === "s" || event.key === "S") && speechSupported) {
        event.preventDefault();
        speak(activeCard.term);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeCard,
    goNext,
    goPrev,
    handleRate,
    sessionDone,
    speak,
    speechSupported,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <fieldset className="flex flex-wrap gap-1.5 border-0 p-0">
          <legend className="sr-only">Lọc thẻ theo trạng thái</legend>
          {FILTER_OPTIONS.map((option) => {
            const active = filter === option.key;
            return (
              <button
                aria-pressed={active}
                className={`min-h-9 cursor-pointer rounded-full border px-3.5 text-xs font-semibold transition ${focusRing} ${
                  active
                    ? "border-[#df5a28] bg-[#fff1ea] text-[#df5a28]"
                    : "border-[#ece9e5] bg-white text-[#5f5953] hover:border-[#dacfc5] hover:text-[#2b2724]"
                }`}
                key={option.key}
                onClick={() => handleFilterChange(option.key)}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </fieldset>

        <div className="flex items-center gap-2">
          <button
            aria-pressed={isShuffled}
            className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${focusRing} ${
              isShuffled
                ? "border-[#df5a28] bg-[#fff1ea] text-[#df5a28]"
                : "border-[#ece9e5] bg-white text-[#5f5953] hover:border-[#dacfc5] hover:text-[#2b2724]"
            }`}
            onClick={handleToggleShuffle}
            type="button"
          >
            <Shuffle aria-hidden="true" className="size-3.5" />
            {isShuffled ? "Đang xáo trộn" : "Xáo trộn"}
          </button>
          <span className="sp-mono rounded-lg bg-[#f4f1ee] px-3 py-2 text-xs font-semibold text-[#5f5953]">
            {studyCards.length === 0
              ? "0 / 0"
              : `${safeIndex + 1} / ${studyCards.length}`}
          </span>
        </div>
      </div>

      {studyCards.length === 0 ? (
        <div className="rounded-2xl border border-[#ece9e5] bg-[#faf7f5] px-6 py-12 text-center">
          <p className="text-base font-semibold text-[#2b2724]">
            Không có thẻ nào khớp bộ lọc này
          </p>
          <p className="mt-1.5 text-sm text-[#5f5953]">
            Chuyển về “Tất cả” để tiếp tục ôn tập toàn bộ từ vựng trong bộ thẻ.
          </p>
          <button
            className={`${secondaryAction} mt-5`}
            onClick={() => handleFilterChange("all")}
            type="button"
          >
            Xem tất cả thẻ
          </button>
        </div>
      ) : sessionDone ? (
        <div className="rounded-2xl border border-[#ece9e5] bg-[#fdf7ed] px-6 py-10 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#ebf8ed] text-[#3f7a52]">
            <CheckCircle2 aria-hidden="true" className="size-6" />
          </div>
          <h3 className="mt-4 text-xl font-bold text-[#2b2724]">
            Hoàn thành lượt ôn tập!
          </h3>
          <p className="mt-1.5 text-sm text-[#5f5953]">
            Bạn vừa đi qua {studyCards.length} thẻ trong phiên học này.
          </p>
          <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#9fcbac] bg-[#ebf8ed] p-3">
              <p className="sp-mono text-2xl font-bold text-[#3f7a52]">
                {sessionStats.mastered}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[#3f7a52]">
                Đã thuộc
              </p>
            </div>
            <div className="rounded-xl border border-[#d9a43a]/50 bg-[#fbf3c8] p-3">
              <p className="sp-mono text-2xl font-bold text-[#a16207]">
                {sessionStats.review}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[#a16207]">
                Cần ôn
              </p>
            </div>
            <div className="rounded-xl border border-[#d9544f]/40 bg-[#f6e1e1] p-3">
              <p className="sp-mono text-2xl font-bold text-[#bd2a2a]">
                {sessionStats.learning}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[#bd2a2a]">
                Chưa nhớ
              </p>
            </div>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              className={primaryAction}
              onClick={() => restartSession("unmastered")}
              type="button"
            >
              Ôn lại các thẻ chưa thuộc
            </button>
            <button
              className={secondaryAction}
              onClick={() => restartSession("all")}
              type="button"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              Học lại từ đầu
            </button>
          </div>
        </div>
      ) : activeCard ? (
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e9e4df]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#cc2f20] to-[#e36a22] transition-[width] duration-300"
              style={{
                width: `${Math.round(((safeIndex + 1) / studyCards.length) * 100)}%`,
              }}
            />
          </div>

          <div className="fc-scene">
            <div
              className={`fc-card ${flipped ? "fc-card-flipped" : ""}`}
              data-flipped={flipped ? "true" : "false"}
            >
              {/* Front face */}
              <div className="fc-face rounded-[20px] border border-[#dacfc5] bg-white p-6 shadow-[0_12px_32px_-16px_rgb(62_44_30/0.16)] md:p-8">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        STATUS_META[getCardStatus(progress, activeCard.id)]
                          .chipClass
                      }
                    >
                      {
                        STATUS_META[getCardStatus(progress, activeCard.id)]
                          .label
                      }
                    </span>
                    <span className="sp-chip sp-chip-orange">
                      {activeCard.toeicPart}
                    </span>
                    <span className="sp-chip sp-chip-neutral">
                      {activeCard.level}
                    </span>
                  </div>

                  <button
                    aria-label={
                      isCardStarred(progress, activeCard.id)
                        ? "Bỏ đánh dấu thẻ"
                        : "Đánh dấu thẻ quan trọng"
                    }
                    aria-pressed={isCardStarred(progress, activeCard.id)}
                    className={`grid size-9 cursor-pointer place-items-center rounded-lg border transition ${focusRing} ${
                      isCardStarred(progress, activeCard.id)
                        ? "border-[#d9a43a] bg-[#fbf3c8] text-[#a16207]"
                        : "border-[#ece9e5] bg-white text-[#948d86] hover:border-[#dacfc5] hover:text-[#2b2724]"
                    }`}
                    onClick={() => onToggleStar(activeCard.id)}
                    type="button"
                  >
                    <Star
                      aria-hidden="true"
                      className="size-4"
                      fill={
                        isCardStarred(progress, activeCard.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                </div>

                <div className="my-auto flex flex-col items-center py-6 text-center">
                  <button
                    aria-label={`Lật thẻ để xem nghĩa của ${activeCard.term}`}
                    className={`flex w-full cursor-pointer flex-col items-center rounded-xl py-3 text-center transition hover:bg-[#faf7f5]/80 ${focusRing}`}
                    onClick={() => setFlipped(true)}
                    type="button"
                  >
                    <span className="text-sm font-medium italic text-[#5f5953]">
                      {activeCard.partOfSpeech}
                    </span>
                    <span className="mt-2 text-3xl font-bold tracking-tight text-[#2b2724] sm:text-4xl">
                      {activeCard.term}
                    </span>
                    {activeCard.phonetic && (
                      <span className="sp-mono mt-2.5 text-base text-[#5f5953]">
                        {activeCard.phonetic}
                      </span>
                    )}
                  </button>

                  {speechSupported && (
                    <button
                      aria-label={`Nghe phát âm ${activeCard.term}`}
                      className={`mt-4 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-[#dacfc5] bg-[#faf7f5] px-4 text-sm font-semibold text-[#2b2724] transition hover:border-[#df5a28] hover:bg-[#fff1ea] hover:text-[#df5a28] ${focusRing}`}
                      onClick={() => speak(activeCard.term)}
                      type="button"
                    >
                      <Volume2 aria-hidden="true" className="size-4" />
                      Nghe phát âm (S)
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-[#ece9e5] pt-4 text-xs text-[#948d86]">
                  <span>Nhấn vào thẻ hoặc phím Space để xem nghĩa</span>
                  <button
                    className={`cursor-pointer font-semibold text-[#df5a28] hover:underline ${focusRing}`}
                    onClick={() => setFlipped(true)}
                    type="button"
                  >
                    Lật thẻ →
                  </button>
                </div>
              </div>

              {/* Back face */}
              <div className="fc-face fc-face-back rounded-[20px] border border-[#e9c6a4] bg-[#fdf7ed] p-6 shadow-[0_12px_32px_-16px_rgb(204_47_32/0.16)] md:p-8">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-[#2b2724]">
                      {activeCard.term}
                    </span>
                    <span className="text-xs italic text-[#5f5953]">
                      ({activeCard.partOfSpeech})
                    </span>
                  </div>
                  <button
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold text-[#5f5953] transition hover:bg-white/80 hover:text-[#2b2724] ${focusRing}`}
                    onClick={() => setFlipped(false)}
                    type="button"
                  >
                    ← Mặt trước
                  </button>
                </div>

                <div className="my-auto space-y-5 py-5">
                  <div>
                    <p className="text-xs font-semibold text-[#948d86]">
                      Nghĩa ngữ cảnh TOEIC
                    </p>
                    <p className="mt-1 text-2xl font-bold leading-snug text-[#2b2724]">
                      {activeCard.meaningVi}
                    </p>
                  </div>

                  {activeCard.exampleEn && (
                    <div className="rounded-xl border border-[#e9c6a4]/70 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[15px] font-medium leading-relaxed text-[#2b2724]">
                          “{activeCard.exampleEn}”
                        </p>
                        {speechSupported && (
                          <button
                            aria-label="Nghe câu ví dụ"
                            className={`grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-[#ece9e5] text-[#5f5953] transition hover:border-[#df5a28] hover:text-[#df5a28] ${focusRing}`}
                            onClick={() => speak(activeCard.exampleEn)}
                            type="button"
                          >
                            <Volume2 aria-hidden="true" className="size-4" />
                          </button>
                        )}
                      </div>
                      {activeCard.exampleVi && (
                        <p className="mt-2 text-sm text-[#5f5953]">
                          {activeCard.exampleVi}
                        </p>
                      )}
                    </div>
                  )}

                  {activeCard.collocations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#948d86]">
                        Cụm từ hay gặp trong đề
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {activeCard.collocations.map((collocation) => (
                          <span
                            className="rounded-lg border border-[#dacfc5] bg-white px-2.5 py-1 text-xs font-medium text-[#2b2724]"
                            key={collocation}
                          >
                            {collocation}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#e9c6a4]/70 pt-3 text-xs text-[#5f5953]">
                  Đánh giá mức độ ghi nhớ bên dưới (phím 1, 2, 3) để chuyển thẻ
                </div>
              </div>
            </div>
          </div>

          {/* Mastery rating + prev/next controls */}
          <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <button
              aria-label="Thẻ trước"
              className={`${secondaryAction} px-3.5`}
              onClick={goPrev}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
              <span className="sm:hidden">Trước</span>
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button
                className={`flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-xl border border-[#d9544f]/40 bg-[#f6e1e1] px-2 py-1.5 text-center transition hover:brightness-95 ${focusRing}`}
                onClick={() => handleRate("learning")}
                type="button"
              >
                <span className="text-sm font-bold text-[#bd2a2a]">
                  Chưa nhớ
                </span>
                <span className="sp-mono text-[11px] text-[#bd2a2a]/80">
                  Phím 1
                </span>
              </button>

              <button
                className={`flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-xl border border-[#d9a43a]/50 bg-[#fbf3c8] px-2 py-1.5 text-center transition hover:brightness-95 ${focusRing}`}
                onClick={() => handleRate("review")}
                type="button"
              >
                <span className="text-sm font-bold text-[#a16207]">Cần ôn</span>
                <span className="sp-mono text-[11px] text-[#a16207]/80">
                  Phím 2
                </span>
              </button>

              <button
                className={`flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-xl border border-[#5e9b70]/50 bg-[#ebf8ed] px-2 py-1.5 text-center transition hover:brightness-95 ${focusRing}`}
                onClick={() => handleRate("mastered")}
                type="button"
              >
                <span className="text-sm font-bold text-[#3f7a52]">
                  Đã thuộc
                </span>
                <span className="sp-mono text-[11px] text-[#3f7a52]/80">
                  Phím 3
                </span>
              </button>
            </div>

            <button
              aria-label="Thẻ tiếp theo"
              className={`${secondaryAction} px-3.5`}
              onClick={goNext}
              type="button"
            >
              <span className="sm:hidden">Tiếp</span>
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
