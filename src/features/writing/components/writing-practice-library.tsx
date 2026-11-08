"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  getWritingPracticeExercises,
  startWritingPractice,
  type WritingPracticeExercisePageApi,
} from "@/features/writing/attempt-api";
import { PageIntro } from "@/shared/components/practice/page-intro";
import { PracticePage } from "@/shared/components/practice/practice-page";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/shared/components/practice/state-panels";
import {
  primaryAction,
  secondaryAction,
} from "@/shared/components/practice/styles";
import { WritingHeader } from "./writing-header";

export function WritingPracticeLibrary({ part }: { part: 1 | 2 | 3 }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<WritingPracticeExercisePageApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setData(null);
      try {
        setData(await getWritingPracticeExercises(part, page, signal));
        setError(null);
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error ? cause.message : "Không thể tải bài tập.",
          );
      }
    },
    [part, page],
  );
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [load]);
  const start = async (id: string) => {
    setStarting(id);
    try {
      const attempt = await startWritingPractice(id);
      router.push(`/writing/attempts/${encodeURIComponent(attempt.id)}`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể bắt đầu bài tập.",
      );
      setStarting(null);
    }
  };
  return (
    <PracticePage header={<WritingHeader />}>
      <PageIntro
        eyebrow={`WRITING PART ${part}`}
        title="Luyện bài tập Writing"
        description="Chọn bài tập đã công bố, viết theo tốc độ của bạn và nhận phản hồi từ AI."
      />
      {error && <ErrorPanel message={error} onRetry={() => void load()} />}
      {!data && !error && <LoadingPanel label="Đang tải bài tập…" />}
      {data && data.items.length === 0 && (
        <EmptyPanel title="Chưa có bài tập được công bố" />
      )}
      {data && data.items.length > 0 && (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((exercise) => (
              <article
                className="rounded-2xl border border-slate-200 bg-white p-5"
                key={exercise.id}
              >
                <p className="text-sm font-semibold text-orange-700">
                  {exercise.code} · {exercise.difficulty}
                </p>
                <h2 className="mt-2 text-lg font-bold">{exercise.topic}</h2>
                <button
                  className={`mt-5 ${primaryAction}`}
                  disabled={starting !== null}
                  onClick={() => void start(exercise.id)}
                  type="button"
                >
                  {starting === exercise.id ? "Đang bắt đầu…" : "Làm bài"}
                </button>
              </article>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button
              className={secondaryAction}
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              type="button"
            >
              Trang trước
            </button>
            <span>Trang {page}</span>
            <button
              className={secondaryAction}
              disabled={page * data.pageSize >= data.totalCount}
              onClick={() => setPage(page + 1)}
              type="button"
            >
              Trang sau
            </button>
          </div>
        </>
      )}
    </PracticePage>
  );
}
