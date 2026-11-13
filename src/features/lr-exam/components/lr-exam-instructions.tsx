"use client";

import Link from "next/link";
import { useState } from "react";
import type { LrExamSummary } from "../types";
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
    body: "Khi đồng hồ chạm 00:00:00, hệ thống tự động thu bài. Hãy kiểm tra các câu chưa chọn đáp án trước khi kết thúc.",
  },
];

export function LrExamInstructions({ exam }: { exam: LrExamSummary }) {
  const [ready, setReady] = useState(false);
  const [soundChecked, setSoundChecked] = useState(false);

  const metrics = [
    { icon: "list-checks", value: `${exam.totalQuestions}`, label: "câu hỏi" },
    { icon: "timer", value: `${exam.durationMinutes} phút`, label: "làm bài" },
    { icon: "headphones", value: "2 kỹ năng", label: "Nghe & Đọc" },
    { icon: "trophy", value: exam.scoreScale, label: "Thang điểm ETS" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#faf7f5] text-[#4c4542]">
      <LearnerNav />
      <main className="mx-auto flex max-w-[1282px] flex-col gap-6 px-4 py-10 sm:px-12 lg:px-[220px]">
        <p className="text-[13px] text-[#77716e]">{exam.breadcrumb}</p>
        <section
          aria-labelledby="exam-title"
          className="flex flex-col gap-6 rounded-2xl border border-[#eee9e6] bg-white p-6 sm:p-8"
        >
          <Pill>LISTENING &amp; READING · FULL TEST</Pill>
          <h1 className="text-[32px] leading-tight font-bold" id="exam-title">
            {exam.title}
          </h1>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <li
                className="flex flex-col gap-2 rounded-xl bg-[#faf7f5] p-5"
                key={metric.label}
              >
                <ExamIcon name={metric.icon} />
                <p className="text-2xl leading-tight font-semibold">
                  {metric.value}
                </p>
                <p className="text-[13px] text-[#77716e]">{metric.label}</p>
              </li>
            ))}
          </ul>

          <h2 className="text-lg font-semibold">
            Trước khi bắt đầu, hãy đọc kỹ quy chế
          </h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {rules.map((rule) => (
              <li className="flex flex-col gap-2" key={rule.index}>
                <Pill>{rule.index}</Pill>
                <h3 className="text-[15px] font-semibold">{rule.title}</h3>
                <p className="text-[13px] text-[#77716e]">{rule.body}</p>
              </li>
            ))}
          </ol>

          <section
            aria-labelledby="sound-check-title"
            className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] px-5 py-3.5"
          >
            <div className="flex flex-col gap-1">
              <h3
                className="text-[13px] font-semibold text-[#1d4ed8]"
                id="sound-check-title"
              >
                KIỂM TRA ÂM THANH TAI NGHE (SOUND CHECK)
              </h3>
              <p className="text-xs text-[#475569]">
                Nghe đoạn thử nghiệm mẫu phát âm chuẩn ETS (US/UK) và cân chỉnh
                âm lượng thoải mái nhất.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                aria-pressed={soundChecked}
                className={`rounded-md bg-[#1d4ed8] px-3.5 py-[7px] text-[11px] font-semibold text-white hover:bg-[#1e40af] ${focusRing}`}
                onClick={() => setSoundChecked(true)}
                type="button"
              >
                Phát âm thanh mẫu (00:15)
              </button>
              <span className="text-[11px] font-medium text-[#475569]">
                Âm lượng: 80%
              </span>
              {soundChecked ? (
                <output className="rounded border border-[#a7f3d0] bg-[#ecfdf5] px-2 py-1 text-[10.5px] font-bold text-[#047857]">
                  ✓ Nghe rõ ràng
                </output>
              ) : null}
            </div>
          </section>

          <label
            className={`flex cursor-pointer items-start gap-3 rounded-xl p-4 text-[13px] ${ready ? "bg-[#e5f4ec]" : "bg-[#faf7f5]"}`}
          >
            <input
              checked={ready}
              className="mt-0.5 size-5 accent-[#398565]"
              onChange={(event) => setReady(event.target.checked)}
              type="checkbox"
            />
            <span>Tôi đã sẵn sàng và đảm bảo đường truyền mạng ổn định</span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link className={secondaryButton} href="/">
              ← Về danh sách đề
            </Link>
            {ready ? (
              <Link
                className={primaryButton}
                href={`/exams/lr/${exam.id}/attempt`}
              >
                BẮT ĐẦU LÀM BÀI THI L&amp;R
              </Link>
            ) : (
              <button
                aria-disabled="true"
                className={primaryButton}
                disabled
                type="button"
              >
                BẮT ĐẦU LÀM BÀI THI L&amp;R
              </button>
            )}
          </div>
        </section>
        <p className="text-center text-[11px] text-[#77716e]">
          Bài thi được lưu tự động · Khuyến nghị dùng tai nghe và trình duyệt
          Chrome mới nhất
        </p>
      </main>
    </div>
  );
}
