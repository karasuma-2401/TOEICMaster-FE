"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLrOverview, startLrAttempt, type LrOverviewApi } from "../api";
import {
  ExamIcon,
  LearnerNav,
  Pill,
  focusRing,
  primaryButton,
  secondaryButton,
} from "./exam-ui";

const rules = [
  {
    index: "01",
    title: "Listening · Câu 1–100",
    body: "File âm thanh chạy liên tục. Không thể tạm dừng hay tua lại. Sau khi chuyển sang Reading, không thể sửa đáp án Listening.",
  },
  {
    index: "02",
    title: "Reading · Câu 101–200",
    body: "Tự do điều hướng giữa các câu hỏi Reading. Có thể gắn cờ để kiểm tra lại trước khi nộp bài.",
  },
  {
    index: "03",
    title: "Tự động nộp bài",
    body: "Máy chủ quản lý thời gian làm bài và tự động nộp khi hết hạn.",
  },
];

export function LrExamInstructions({ examId }: { examId: string }) {
  const router = useRouter();
  const [exam, setExam] = useState<LrOverviewApi | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void getLrOverview(examId, controller.signal)
      .then(setExam)
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : "Không thể tải thông tin đề thi.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [examId]);

  async function begin() {
    setStarting(true);
    setError(null);
    try {
      // Backend resumes the current attempt when one exists; otherwise it creates a new attempt.
      const attempt = await startLrAttempt(examId);
      router.push(`/exams/lr/attempts/${attempt.attemptId}/attempt`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể bắt đầu bài thi.");
      setStarting(false);
    }
  }

  const metrics = exam ? [
    { icon: "list-checks", value: String(exam.totalQuestions), label: "câu hỏi" },
    { icon: "timer", value: `${exam.durationMinutes} phút`, label: "làm bài" },
    { icon: "headphones", value: `${exam.listeningQuestions} + ${exam.readingQuestions}`, label: "Nghe & Đọc" },
    { icon: "trophy", value: `${exam.minScaledScore}–${exam.maxScaledScore}`, label: "Thang điểm ETS" },
  ] as const : [];

  return (
    <div className="min-h-screen bg-[#faf7f5] text-[#4c4542]">
      <LearnerNav />
      <main className="mx-auto flex max-w-[1282px] flex-col gap-6 px-4 py-10 sm:px-12 lg:px-[220px]">
        <p className="text-[13px] text-[#77716e]">Trang chủ / Đề thi thử / {exam?.code ?? "Listening & Reading"}</p>
        <section aria-labelledby="exam-title" className="flex flex-col gap-6 rounded-2xl border border-[#eee9e6] bg-white p-6 sm:p-8">
          <Pill>LISTENING &amp; READING · FULL TEST</Pill>
          <h1 className="text-[32px] leading-tight font-bold" id="exam-title">
            {loading ? "Đang tải thông tin đề thi…" : exam?.title ?? "Không thể tải đề thi"}
          </h1>

          {exam ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => (
                <li className="flex flex-col gap-2 rounded-xl bg-[#faf7f5] p-5" key={metric.label}>
                  <ExamIcon name={metric.icon} />
                  <p className="text-2xl leading-tight font-semibold">{metric.value}</p>
                  <p className="text-[13px] text-[#77716e]">{metric.label}</p>
                </li>
              ))}
            </ul>
          ) : null}

          <h2 className="text-lg font-semibold">Trước khi bắt đầu, hãy đọc kỹ quy chế</h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {rules.map((rule) => (
              <li className="flex flex-col gap-2" key={rule.index}>
                <Pill>{rule.index}</Pill>
                <h3 className="text-[15px] font-semibold">{rule.title}</h3>
                <p className="text-[13px] text-[#77716e]">{rule.body}</p>
              </li>
            ))}
          </ol>

          <label className={`flex cursor-pointer items-start gap-3 rounded-xl p-4 text-[13px] ${ready ? "bg-[#e5f4ec]" : "bg-[#faf7f5]"}`}>
            <input checked={ready} className="mt-0.5 size-5 accent-[#398565]" onChange={(event) => setReady(event.target.checked)} type="checkbox" />
            <span>Tôi đã sẵn sàng và đảm bảo đường truyền mạng, tai nghe hoạt động ổn định</span>
          </label>

          {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <a className={secondaryButton} href="/listening">← Về danh sách đề</a>
            <button className={primaryButton} disabled={!ready || !exam || starting || loading} onClick={() => void begin()} type="button">
              {starting ? "Đang chuẩn bị bài thi…" : exam?.activeAttemptId ? "TIẾP TỤC BÀI THI" : "BẮT ĐẦU LÀM BÀI THI L&R"}
            </button>
          </div>
        </section>
        <p className="text-center text-[11px] text-[#77716e]">Đáp án được lưu trên máy chủ · Thời gian do máy chủ kiểm soát</p>
      </main>
    </div>
  );
}
