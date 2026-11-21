"use client";

import {
  Flame,
  RotateCcw,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useWordSpeech } from "@/features/pronunciation/hooks/use-word-speech";
import {
  focusRing,
  primaryAction,
  secondaryAction,
} from "@/shared/components/practice/styles";
import { shuffleCards } from "../storage";
import type { CardMastery, FlashcardItem } from "../types";

interface MatchTile {
  uid: string;
  cardId: string;
  kind: "term" | "meaning";
  text: string;
  subtitle?: string;
}

const MAX_PAIRS_PER_ROUND = 6;
const PENALTY_MS = 2000;

function formatElapsed(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

function readBestTime(deckId: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(
      `toeicmaster.fc.match.best.${deckId}`,
    );
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeBestTime(deckId: string, ms: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `toeicmaster.fc.match.best.${deckId}`,
      String(ms),
    );
  } catch {
    // Ignore storage errors.
  }
}

export function FlashcardMatchGame({
  deckId,
  cards,
  onRateCard,
}: {
  deckId: string;
  cards: readonly FlashcardItem[];
  onRateCard: (cardId: string, status: CardMastery) => void;
}) {
  const { supported: speechSupported, speak } = useWordSpeech();
  const [audioOnMatch, setAudioOnMatch] = useState(true);
  const [roundIndex, setRoundIndex] = useState(0);
  const [replaySeed, setReplaySeed] = useState(0);
  const [bestMs, setBestMs] = useState<number | null>(() =>
    readBestTime(deckId),
  );

  const totalRounds = Math.max(
    1,
    Math.ceil(cards.length / MAX_PAIRS_PER_ROUND),
  );

  const roundCards = useMemo(() => {
    const start = (roundIndex % totalRounds) * MAX_PAIRS_PER_ROUND;
    return cards.slice(start, start + MAX_PAIRS_PER_ROUND);
  }, [cards, roundIndex, totalRounds]);

  const tiles = useMemo<MatchTile[]>(() => {
    const pairs: MatchTile[] = roundCards.flatMap((card) => [
      {
        uid: `term-${card.id}`,
        cardId: card.id,
        kind: "term",
        text: card.term,
        subtitle: card.phonetic || card.partOfSpeech,
      },
      {
        uid: `meaning-${card.id}`,
        cardId: card.id,
        kind: "meaning",
        text: card.meaningVi,
      },
    ]);
    return shuffleCards(pairs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundCards, replaySeed]);

  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [matchedCardIds, setMatchedCardIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [wrongPairUids, setWrongPairUids] = useState<[string, string] | null>(
    null,
  );
  const [missedCardIds, setMissedCardIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const isCompleted =
    roundCards.length > 0 && matchedCardIds.size === roundCards.length;

  useEffect(() => {
    if (startedAt === null || isCompleted) return;
    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt + mistakes * PENALTY_MS);
    }, 100);
    return () => window.clearInterval(timer);
  }, [startedAt, isCompleted, mistakes]);

  const resetBoard = (nextRoundIndex = roundIndex) => {
    setRoundIndex(nextRoundIndex);
    setReplaySeed((prev) => prev + 1);
    setSelectedUid(null);
    setMatchedCardIds(new Set());
    setWrongPairUids(null);
    setMissedCardIds(new Set());
    setCombo(0);
    setMaxCombo(0);
    setMistakes(0);
    setStartedAt(null);
    setElapsedMs(0);
    setIsNewRecord(false);
  };

  const handleTileClick = (tile: MatchTile) => {
    if (matchedCardIds.has(tile.cardId) || wrongPairUids !== null) return;

    const now = Date.now();
    const activeStart = startedAt ?? now;
    if (startedAt === null) {
      setStartedAt(now);
    }

    if (selectedUid === null) {
      setSelectedUid(tile.uid);
      return;
    }

    if (selectedUid === tile.uid) {
      setSelectedUid(null);
      return;
    }

    const firstTile = tiles.find((item) => item.uid === selectedUid);
    if (!firstTile) {
      setSelectedUid(tile.uid);
      return;
    }

    // Same kind (two English terms or two Vietnamese meanings) -> switch selection cleanly.
    if (firstTile.kind === tile.kind) {
      setSelectedUid(tile.uid);
      return;
    }

    if (firstTile.cardId === tile.cardId) {
      const nextMatched = new Set(matchedCardIds);
      nextMatched.add(tile.cardId);
      setMatchedCardIds(nextMatched);
      setSelectedUid(null);

      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setMaxCombo((prev) => Math.max(prev, nextCombo));

      const matchedCard = roundCards.find((c) => c.id === tile.cardId);
      if (matchedCard && audioOnMatch && speechSupported) {
        speak(matchedCard.term);
      }

      onRateCard(
        tile.cardId,
        missedCardIds.has(tile.cardId) ? "review" : "mastered",
      );

      if (nextMatched.size === roundCards.length) {
        const finalMs = Math.max(
          100,
          now - activeStart + mistakes * PENALTY_MS,
        );
        setElapsedMs(finalMs);
        if (bestMs === null || finalMs < bestMs) {
          setBestMs(finalMs);
          setIsNewRecord(true);
          writeBestTime(deckId, finalMs);
        }
      }
    } else {
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      setCombo(0);
      setWrongPairUids([firstTile.uid, tile.uid]);
      setSelectedUid(null);
      setMissedCardIds((prev) => {
        const next = new Set(prev);
        next.add(firstTile.cardId);
        next.add(tile.cardId);
        return next;
      });
      setElapsedMs(now - activeStart + nextMistakes * PENALTY_MS);

      window.setTimeout(() => {
        setWrongPairUids(null);
      }, 450);
    }
  };

  if (cards.length < 2) {
    return (
      <div className="rounded-2xl border border-[#ece9e5] bg-[#faf7f5] px-6 py-12 text-center">
        <p className="text-base font-semibold text-[#2b2724]">
          Cần ít nhất 2 thẻ để chơi Ghép cặp tốc độ
        </p>
        <p className="mt-1.5 text-sm text-[#5f5953]">
          Hãy thêm từ mới vào bộ thẻ cá nhân này để bắt đầu thử thách ghép cặp.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* HUD bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ece9e5] bg-[#faf7f5] px-4 py-3">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="inline-flex items-center gap-1.5 font-semibold text-[#2b2724]">
            <Timer aria-hidden="true" className="size-4 text-[#df5a28]" />
            <span className="sp-mono text-base">
              {formatElapsed(elapsedMs)}
            </span>
          </div>
          <div className="h-4 w-px bg-[#dacfc5]" />
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5f5953]">
            <span>Đã ghép:</span>
            <span className="sp-mono text-sm font-bold text-[#3f7a52]">
              {matchedCardIds.size}/{roundCards.length}
            </span>
          </div>
          {combo >= 2 && (
            <span className="sp-chip sp-chip-orange">
              <Flame aria-hidden="true" className="size-3.5" />
              Combo ×{combo}
            </span>
          )}
          {mistakes > 0 && (
            <span className="sp-chip sp-chip-danger">
              Sai {mistakes} (+{mistakes * 2}s)
            </span>
          )}
          {bestMs !== null && (
            <span className="sp-chip sp-chip-neutral">
              <Trophy aria-hidden="true" className="size-3.5 text-[#a16207]" />
              Kỷ lục: <span className="sp-mono">{formatElapsed(bestMs)}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {totalRounds > 1 && (
            <span className="sp-mono rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-[#5f5953]">
              Vòng {(roundIndex % totalRounds) + 1}/{totalRounds}
            </span>
          )}
          {speechSupported && (
            <button
              aria-label={
                audioOnMatch
                  ? "Tắt đọc phát âm khi ghép đúng"
                  : "Bật đọc phát âm khi ghép đúng"
              }
              aria-pressed={audioOnMatch}
              className={`grid size-9 cursor-pointer place-items-center rounded-lg border border-[#dacfc5] bg-white text-[#5f5953] transition hover:border-[#df5a28] hover:text-[#df5a28] ${focusRing}`}
              onClick={() => setAudioOnMatch((prev) => !prev)}
              type="button"
            >
              {audioOnMatch ? (
                <Volume2 aria-hidden="true" className="size-4" />
              ) : (
                <VolumeX aria-hidden="true" className="size-4" />
              )}
            </button>
          )}
          <button
            className={`${secondaryAction} min-h-9 px-3 text-xs`}
            onClick={() => resetBoard(roundIndex)}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="size-3.5" />
            Chơi lại
          </button>
        </div>
      </div>

      {isCompleted ? (
        <div className="rounded-2xl border border-[#e9c6a4] bg-[#fdf7ed] px-6 py-10 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#fff1ea] text-[#df5a28]">
            <Trophy aria-hidden="true" className="size-7" />
          </div>
          <h3 className="mt-4 text-2xl font-bold text-[#2b2724]">
            {isNewRecord
              ? "Kỷ lục mới! Ghép sạch bảng"
              : "Hoàn thành vòng ghép cặp!"}
          </h3>
          <p className="mt-1 text-sm text-[#5f5953]">
            Mỗi cặp ghép đúng ngay lần đầu đã được cập nhật sang trạng thái “Đã
            thuộc”.
          </p>

          <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#e9c6a4] bg-white p-3">
              <p className="sp-mono text-2xl font-bold text-[#df5a28]">
                {formatElapsed(elapsedMs)}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[#5f5953]">
                Thời gian
              </p>
            </div>
            <div className="rounded-xl border border-[#e9c6a4] bg-white p-3">
              <p className="sp-mono text-2xl font-bold text-[#3f7a52]">
                ×{maxCombo}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[#5f5953]">
                Combo cao nhất
              </p>
            </div>
            <div className="rounded-xl border border-[#e9c6a4] bg-white p-3">
              <p className="sp-mono text-2xl font-bold text-[#2b2724]">
                {mistakes}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[#5f5953]">
                Lần ghép nhầm
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {totalRounds > 1 && (
              <button
                className={primaryAction}
                onClick={() => resetBoard((roundIndex + 1) % totalRounds)}
                type="button"
              >
                Chơi vòng tiếp theo ({((roundIndex + 1) % totalRounds) + 1}/
                {totalRounds}) →
              </button>
            )}
            <button
              className={totalRounds > 1 ? secondaryAction : primaryAction}
              onClick={() => resetBoard(roundIndex)}
              type="button"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              Chơi lại để phá kỷ lục
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {tiles.map((tile) => {
            const matched = matchedCardIds.has(tile.cardId);
            const selected = selectedUid === tile.uid;
            const wrong =
              wrongPairUids !== null &&
              (wrongPairUids[0] === tile.uid || wrongPairUids[1] === tile.uid);

            let cardClass =
              "border-[#ece9e5] bg-white text-[#2b2724] hover:border-[#e9c6a4] hover:bg-[#fffaf7]";
            if (matched) {
              cardClass =
                "border-[#9fcbac] bg-[#ebf8ed] text-[#3f7a52] opacity-45 cursor-default";
            } else if (wrong) {
              cardClass = "border-[#d9544f] bg-[#f6e1e1] text-[#bd2a2a]";
            } else if (selected) {
              cardClass =
                "border-[#df5a28] bg-[#fff1ea] text-[#df5a28] shadow-[0_6px_16px_-10px_rgb(204_47_32/0.45)]";
            }

            return (
              <button
                aria-pressed={selected}
                className={`flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 p-4 text-center transition ${focusRing} ${cardClass}`}
                disabled={matched}
                key={tile.uid}
                onClick={() => handleTileClick(tile)}
                type="button"
              >
                <span className="mb-1.5 text-[10px] font-bold uppercase tracking-wider opacity-65">
                  {tile.kind === "term" ? "Tiếng Anh" : "Nghĩa Việt"}
                </span>
                <span
                  className={
                    tile.kind === "term"
                      ? "text-base font-bold leading-snug"
                      : "text-sm font-medium leading-snug"
                  }
                >
                  {tile.text}
                </span>
                {tile.subtitle && (
                  <span className="sp-mono mt-1 text-[11px] opacity-70">
                    {tile.subtitle}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
