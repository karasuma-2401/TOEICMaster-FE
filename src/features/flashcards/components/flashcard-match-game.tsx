"use client";

import {
  Flame,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWordSpeech } from "@/features/pronunciation/hooks/use-word-speech";
import {
  focusRing,
  primaryAction,
  secondaryAction,
} from "@/shared/components/practice/styles";
import { getMatchBestStorageKey, shuffleCards } from "../storage";
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

function readBestTime(
  deckId: string,
  pairCount: number,
  userId?: string | null,
): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(
      getMatchBestStorageKey(deckId, pairCount, userId),
    );
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeBestTime(
  deckId: string,
  pairCount: number,
  ms: number,
  userId?: string | null,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      getMatchBestStorageKey(deckId, pairCount, userId),
      String(ms),
    );
  } catch {
    // Ignore storage errors.
  }
}

export function FlashcardMatchGame({
  deckId,
  cards,
  userId = null,
  serverBestMs = null,
  onRateCard,
  onCompleteRun,
}: {
  deckId: string;
  cards: readonly FlashcardItem[];
  userId?: string | null;
  serverBestMs?: number | null;
  onRateCard: (cardId: string, status: CardMastery) => void;
  onCompleteRun?: (elapsedMs: number, maxCombo: number) => void;
}) {
  const { supported: speechSupported, speak } = useWordSpeech();
  const [audioOnMatch, setAudioOnMatch] = useState(true);
  const [roundIndex, setRoundIndex] = useState(0);
  const [replaySeed, setReplaySeed] = useState(0);

  const totalRounds = Math.max(
    1,
    Math.ceil(cards.length / MAX_PAIRS_PER_ROUND),
  );

  // Pad trailing rounds to a full 6-pair board when the deck has >= 6 cards
  // so every round competes on an equal pair count (HIGH-07).
  const roundCards = useMemo(() => {
    const start = (roundIndex % totalRounds) * MAX_PAIRS_PER_ROUND;
    const primary = cards.slice(start, start + MAX_PAIRS_PER_ROUND);
    if (
      primary.length >= MAX_PAIRS_PER_ROUND ||
      cards.length < MAX_PAIRS_PER_ROUND
    ) {
      return primary;
    }
    const existingIds = new Set(primary.map((c) => c.id));
    const filler = cards
      .filter((c) => !existingIds.has(c.id))
      .slice(0, MAX_PAIRS_PER_ROUND - primary.length);
    return [...primary, ...filler];
  }, [cards, roundIndex, totalRounds]);

  const pairCount = roundCards.length;
  const isStandardRecordBoard =
    cards.length < MAX_PAIRS_PER_ROUND || pairCount === MAX_PAIRS_PER_ROUND;

  const [localBestMs, setLocalBestMs] = useState<number | null>(() =>
    readBestTime(deckId, pairCount, userId),
  );

  useEffect(() => {
    setLocalBestMs(readBestTime(deckId, pairCount, userId));
  }, [deckId, pairCount, userId]);

  const effectiveServerBest = isStandardRecordBoard ? serverBestMs : null;
  const bestMs =
    effectiveServerBest !== null && localBestMs !== null
      ? Math.min(effectiveServerBest, localBestMs)
      : (effectiveServerBest ?? localBestMs);

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
  const [accumulatedMs, setAccumulatedMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const tileRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const completionHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const mismatchTimerRef = useRef<number | null>(null);

  const isCompleted =
    roundCards.length > 0 && matchedCardIds.size === roundCards.length;

  useEffect(() => {
    return () => {
      if (mismatchTimerRef.current !== null) {
        window.clearTimeout(mismatchTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (startedAt === null || paused || isCompleted) return;
    const timer = window.setInterval(() => {
      setElapsedMs(
        accumulatedMs + (Date.now() - startedAt) + mistakes * PENALTY_MS,
      );
    }, 100);
    return () => window.clearInterval(timer);
  }, [startedAt, accumulatedMs, paused, isCompleted, mistakes]);

  useEffect(() => {
    if (isCompleted) {
      completionHeadingRef.current?.focus();
    }
  }, [isCompleted]);

  const togglePause = () => {
    if (startedAt === null && accumulatedMs === 0) return;
    if (isCompleted) return;
    if (!paused) {
      const now = Date.now();
      const nextAccumulated =
        accumulatedMs + (startedAt !== null ? now - startedAt : 0);
      setAccumulatedMs(nextAccumulated);
      setStartedAt(null);
      setElapsedMs(nextAccumulated + mistakes * PENALTY_MS);
      setPaused(true);
      setAnnouncement("Game paused.");
    } else {
      setStartedAt(Date.now());
      setPaused(false);
      setAnnouncement("Game resumed.");
    }
  };

  const resetBoard = (nextRoundIndex = roundIndex) => {
    if (mismatchTimerRef.current !== null) {
      window.clearTimeout(mismatchTimerRef.current);
      mismatchTimerRef.current = null;
    }
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
    setAccumulatedMs(0);
    setPaused(false);
    setElapsedMs(0);
    setIsNewRecord(false);
    setAnnouncement("Board reset. Select a term and its matching meaning.");
  };

  const focusNextAvailableTile = (
    currentUid: string,
    nextMatched: Set<string>,
  ) => {
    const currentIndex = tiles.findIndex((item) => item.uid === currentUid);
    const orderedCandidates =
      currentIndex >= 0
        ? [...tiles.slice(currentIndex + 1), ...tiles.slice(0, currentIndex)]
        : tiles;
    const nextTile = orderedCandidates.find(
      (candidate) => !nextMatched.has(candidate.cardId),
    );
    if (nextTile) {
      window.requestAnimationFrame(() => {
        tileRefs.current.get(nextTile.uid)?.focus();
      });
    }
  };

  const handleTileClick = (tile: MatchTile) => {
    if (paused || matchedCardIds.has(tile.cardId) || wrongPairUids !== null) {
      return;
    }

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

    // Same kind (two terms or two meanings) -> switch selection cleanly.
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
          accumulatedMs + (now - activeStart) + mistakes * PENALTY_MS,
        );
        setElapsedMs(finalMs);
        setStartedAt(null);
        const finalMaxCombo = Math.max(maxCombo, nextCombo);
        const beatRecord =
          isStandardRecordBoard && (bestMs === null || finalMs < bestMs);
        if (beatRecord) {
          setLocalBestMs(finalMs);
          setIsNewRecord(true);
          writeBestTime(deckId, pairCount, finalMs, userId);
        }
        setAnnouncement(
          `Board cleared in ${formatElapsed(finalMs)}${beatRecord ? ". New personal record!" : "."}`,
        );
        if (isStandardRecordBoard) {
          onCompleteRun?.(finalMs, finalMaxCombo);
        }
      } else {
        setAnnouncement(
          `Matched ${matchedCard?.term ?? "pair"}. ${nextMatched.size} of ${roundCards.length} pairs matched.`,
        );
        focusNextAvailableTile(tile.uid, nextMatched);
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
      setElapsedMs(
        accumulatedMs + (now - activeStart) + nextMistakes * PENALTY_MS,
      );
      setAnnouncement("Not a match. Plus 2 seconds penalty.");

      if (mismatchTimerRef.current !== null) {
        window.clearTimeout(mismatchTimerRef.current);
      }
      mismatchTimerRef.current = window.setTimeout(() => {
        setWrongPairUids(null);
        mismatchTimerRef.current = null;
      }, 450);
    }
  };

  if (cards.length < 2) {
    return (
      <div className="rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-page)] px-6 py-12 text-center">
        <p className="text-base font-semibold text-[var(--tm-ink)]">
          At least 2 cards are needed to play Speed Match
        </p>
        <p className="mt-1.5 text-sm text-[var(--tm-ink-muted)]">
          Add new words to this custom deck to start the matching challenge.
        </p>
      </div>
    );
  }

  const hasStarted = startedAt !== null || accumulatedMs > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {/* HUD bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-page)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="inline-flex items-center gap-1.5 font-semibold text-[var(--tm-ink)]">
            <Timer
              aria-hidden="true"
              className="size-4 text-[var(--tm-brand)]"
            />
            <span className="sp-mono text-base">
              {formatElapsed(elapsedMs)}
            </span>
          </div>
          <div className="h-4 w-px bg-[var(--tm-border-strong)]" />
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--tm-ink-muted)]">
            <span>Matched:</span>
            <span className="sp-mono text-sm font-bold text-[var(--tm-success)]">
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
              Misses: {mistakes} (+{mistakes * 2}s)
            </span>
          )}
          {bestMs !== null && (
            <span className="sp-chip sp-chip-neutral">
              <Trophy
                aria-hidden="true"
                className="size-3.5 text-[var(--tm-warning)]"
              />
              Best: <span className="sp-mono">{formatElapsed(bestMs)}</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {totalRounds > 1 && (
            <span className="sp-mono rounded-lg bg-[var(--tm-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--tm-ink-muted)]">
              Round {(roundIndex % totalRounds) + 1}/{totalRounds}
            </span>
          )}
          {hasStarted && !isCompleted && (
            <button
              aria-pressed={paused}
              className={`${secondaryAction} min-h-9 px-3 text-xs`}
              onClick={togglePause}
              type="button"
            >
              {paused ? (
                <>
                  <Play aria-hidden="true" className="size-3.5" />
                  Resume
                </>
              ) : (
                <>
                  <Pause aria-hidden="true" className="size-3.5" />
                  Pause
                </>
              )}
            </button>
          )}
          {speechSupported && (
            <button
              aria-label={
                audioOnMatch
                  ? "Mute pronunciation on match"
                  : "Enable pronunciation on match"
              }
              aria-pressed={audioOnMatch}
              className={`grid size-9 cursor-pointer place-items-center rounded-lg border border-[var(--tm-border-strong)] bg-[var(--tm-surface)] text-[var(--tm-ink-muted)] transition hover:border-[var(--tm-brand)] hover:text-[var(--tm-brand)] ${focusRing}`}
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
            Play again
          </button>
        </div>
      </div>

      {isCompleted ? (
        <div className="rounded-2xl border border-[#e9c6a4] bg-[var(--tm-brand-soft)] px-6 py-10 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--tm-surface)] text-[var(--tm-brand)]">
            <Trophy aria-hidden="true" className="size-7" />
          </div>
          <h2
            className="mt-4 text-2xl font-bold text-[var(--tm-ink)] outline-none"
            ref={completionHeadingRef}
            tabIndex={-1}
          >
            {isNewRecord
              ? "New record! Board cleared"
              : "Matching round complete!"}
          </h2>
          <p className="mt-1 text-sm text-[var(--tm-ink-muted)]">
            Every pair matched on the first try has been marked as
            &ldquo;Mastered&rdquo;.
          </p>

          <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#e9c6a4] bg-[var(--tm-surface)] p-3">
              <p className="sp-mono text-2xl font-bold text-[var(--tm-brand)]">
                {formatElapsed(elapsedMs)}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[var(--tm-ink-muted)]">
                Time
              </p>
            </div>
            <div className="rounded-xl border border-[#e9c6a4] bg-[var(--tm-surface)] p-3">
              <p className="sp-mono text-2xl font-bold text-[var(--tm-success)]">
                ×{maxCombo}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[var(--tm-ink-muted)]">
                Best combo
              </p>
            </div>
            <div className="rounded-xl border border-[#e9c6a4] bg-[var(--tm-surface)] p-3">
              <p className="sp-mono text-2xl font-bold text-[var(--tm-ink)]">
                {mistakes}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[var(--tm-ink-muted)]">
                Mistakes
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
                Play next round ({((roundIndex + 1) % totalRounds) + 1}/
                {totalRounds}) →
              </button>
            )}
            <button
              className={totalRounds > 1 ? secondaryAction : primaryAction}
              onClick={() => resetBoard(roundIndex)}
              type="button"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              Play again to beat your record
            </button>
          </div>
        </div>
      ) : paused ? (
        <div className="rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-page)] px-6 py-12 text-center">
          <p className="text-lg font-bold text-[var(--tm-ink)]">Game paused</p>
          <p className="mt-1 text-sm text-[var(--tm-ink-muted)]">
            Your timer is frozen at {formatElapsed(elapsedMs)}.
          </p>
          <button
            className={`${primaryAction} mt-5`}
            onClick={togglePause}
            type="button"
          >
            <Play aria-hidden="true" className="size-4" />
            Resume matching
          </button>
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
              "border-[var(--tm-border)] bg-[var(--tm-surface)] text-[var(--tm-ink)] hover:border-[#e9c6a4] hover:bg-[var(--tm-brand-soft)]";
            if (matched) {
              cardClass =
                "border-[var(--tm-success)]/40 bg-[var(--tm-success-soft)] text-[var(--tm-success)] opacity-55 cursor-default";
            } else if (wrong) {
              cardClass =
                "fc-mismatch-shake border-[var(--tm-danger)] bg-[var(--tm-danger-soft)] text-[var(--tm-danger)]";
            } else if (selected) {
              cardClass =
                "border-[var(--tm-brand)] bg-[var(--tm-brand-soft)] text-[var(--tm-brand)] shadow-[0_6px_16px_-10px_rgb(204_47_32/0.45)]";
            }

            return (
              <button
                aria-pressed={selected}
                className={`flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 p-4 text-center transition ${focusRing} ${cardClass}`}
                disabled={matched}
                key={tile.uid}
                onClick={() => handleTileClick(tile)}
                ref={(node) => {
                  if (node) {
                    tileRefs.current.set(tile.uid, node);
                  } else {
                    tileRefs.current.delete(tile.uid);
                  }
                }}
                type="button"
              >
                <span className="mb-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-80">
                  {wrong && <XCircle aria-hidden="true" className="size-3.5" />}
                  {wrong
                    ? "Mismatch"
                    : tile.kind === "term"
                      ? "Term"
                      : "Meaning"}
                </span>
                <span
                  className={
                    tile.kind === "term"
                      ? "text-base font-bold leading-snug"
                      : "text-sm font-medium leading-snug"
                  }
                  lang={tile.kind === "meaning" ? "vi" : undefined}
                >
                  {tile.text}
                </span>
                {tile.subtitle && (
                  <span className="sp-mono mt-1 text-[11px] opacity-80">
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
