"use client";

import { useEffect, useState } from "react";
import { listSpeakingExercises } from "@/features/speaking/admin-api";
import type {
  SpeakingDifficulty,
  SpeakingExercise,
  Page,
  SpeakingPart,
} from "@/features/speaking/types";
import {
  adminInput,
  adminSecondary,
} from "@/features/admin/components/content/admin-styles";
import { errorMessage } from "./admin-load-state";
import { TablePagination } from "./table-pagination";

/** Server-side search can reach the entire bank, including exercises beyond the first 100. */
export function ExercisePickerPanel({
  part,
  selected,
  onPick,
  onClose,
}: {
  part: SpeakingPart;
  selected: Record<string, string>;
  onPick: (exercise: SpeakingExercise) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<SpeakingDifficulty | "">("");
  const [pageNumber, setPageNumber] = useState(1);
  const [page, setPage] = useState<Page<SpeakingExercise> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listSpeakingExercises(
          {
            part,
            query,
            difficulty: difficulty || undefined,
            status: "PUBLISHED",
            pageNumber,
            pageSize: 20,
          },
          controller.signal,
        );
        if (!controller.signal.aborted) setPage(result);
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(errorMessage(cause, "Không thể tìm bài tập."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [part, query, difficulty, pageNumber, retry]);
  return (
    <section
      aria-label={`Chọn bài Part ${part}`}
      className="space-y-3 rounded-xl border border-[var(--admin-border)] bg-white p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold">Chọn bài · Part {part}</h3>
        <button className={adminSecondary} onClick={onClose} type="button">
          Đóng bộ chọn
        </button>
      </div>
      <input
        aria-label="Tìm mã hoặc chủ đề bài tập"
        className={adminInput}
        placeholder="Tìm mã hoặc chủ đề…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setPageNumber(1);
        }}
      />
      <select
        aria-label="Độ khó bài tập"
        className={adminInput}
        value={difficulty}
        onChange={(event) => {
          setDifficulty(event.target.value as SpeakingDifficulty | "");
          setPageNumber(1);
        }}
      >
        <option value="">Tất cả độ khó</option>
        <option value="EASY">Dễ</option>
        <option value="MEDIUM">Trung bình</option>
        <option value="HARD">Khó</option>
      </select>
      {error && (
        <div role="alert">
          {error}{" "}
          <button
            className={adminSecondary}
            onClick={() => setRetry((value) => value + 1)}
            type="button"
          >
            Thử lại
          </button>
        </div>
      )}
      {loading ? (
        <output>Đang tìm bài tập…</output>
      ) : (
        !error && (
          <ul className="divide-y divide-[var(--admin-border)]">
            {page?.items.map((exercise) => (
              <li
                className="flex items-center justify-between gap-3 py-3"
                key={exercise.id}
              >
                <span>
                  <b>{exercise.code}</b> · {exercise.topic}
                  <small className="block">
                    {exercise.difficulty}
                    {selected[exercise.id]
                      ? ` · Đang dùng ở ${selected[exercise.id]}`
                      : ""}
                  </small>
                </span>
                <button
                  className={adminSecondary}
                  disabled={Boolean(selected[exercise.id])}
                  onClick={() => onPick(exercise)}
                  type="button"
                >
                  Chọn {exercise.code}
                </button>
              </li>
            ))}
            {page?.items.length === 0 && <li>Không có bài phù hợp.</li>}
          </ul>
        )
      )}
      <TablePagination
        onPage={setPageNumber}
        page={pageNumber}
        pages={Math.max(1, page?.totalPages ?? 1)}
        total={page?.totalCount ?? 0}
        unit="bài"
      />
      <a
        className="text-sm underline"
        href="/admin/content/speaking"
        target="_blank"
        rel="noreferrer"
      >
        Tạo bài mới ↗
      </a>
    </section>
  );
}
