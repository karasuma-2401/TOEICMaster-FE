import Link from "next/link";
import { LR_PARTS } from "../parts";
import type { LrPartResult, LrResultReport } from "../types";
import { LearnerNav, Pill, primaryButton, secondaryButton } from "./exam-ui";

export interface LrResultReportViewProps {
  report: LrResultReport;
  examHref: string;
  reviewHref: string;
}

function accuracyPercent(correct: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

function partRating(percent: number) {
  if (percent >= 90) {
    return {
      label: "Xuất sắc",
      tone: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
    };
  }
  if (percent >= 80) {
    return {
      label: "Tốt",
      tone: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    };
  }
  if (percent >= 65) {
    return {
      label: "Khá",
      tone: "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]",
    };
  }
  return {
    label: "Cần rèn thêm",
    tone: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  };
}

function PartPerformanceRow({
  result,
  barColor,
}: {
  result: LrPartResult;
  barColor: string;
}) {
  const spec = LR_PARTS.find((part) => part.id === result.part);
  const percent = accuracyPercent(result.correct, result.total);
  const rating = partRating(percent);

  return (
    <li className="grid items-center gap-3 rounded-xl border border-[#F1EDE9] bg-[#FAF8F7] px-4 py-3 sm:grid-cols-[minmax(190px,230px)_minmax(0,1fr)_auto_auto]">
      <span className="text-[13px] font-semibold text-[#302C2A]">
        Part {result.part}: {spec?.reportTitle ?? ""}
      </span>
      <progress
        aria-label={`Part ${result.part}: ${percent}%`}
        className={`h-2.5 w-full overflow-hidden rounded-full bg-[#E2E8F0] [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-[#E2E8F0] [&::-webkit-progress-value]:rounded-full ${barColor}`}
        max={100}
        value={percent}
      />
      <span className="text-[13px] font-semibold tabular-nums text-[#302C2A]">
        {percent}% ({result.correct}/{result.total} câu)
      </span>
      <span
        className={`inline-flex w-fit items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${rating.tone}`}
      >
        {rating.label}
      </span>
    </li>
  );
}

export function LrResultReportView({
  report,
  examHref,
  reviewHref,
}: LrResultReportViewProps) {
  const reached =
    report.targetScore !== undefined && report.totalScore >= report.targetScore;
  const listeningAccuracy = accuracyPercent(
    report.listeningRaw.correct,
    report.listeningRaw.total,
  );
  const readingAccuracy = accuracyPercent(
    report.readingRaw.correct,
    report.readingRaw.total,
  );
  const listeningParts = report.parts.filter((part) => part.part <= 4);
  const readingParts = report.parts.filter((part) => part.part >= 5);

  return (
    <div className="min-h-screen bg-[#faf7f5] text-[#4c4542]">
      <LearnerNav />
      <main
        className="mx-auto flex max-w-[1100px] flex-col gap-6 px-4 py-10 sm:px-8"
        id="main-content"
        tabIndex={-1}
      >
        <header className="flex flex-col gap-2">
          <Pill>BÁO CÁO KẾT QUẢ · {report.scale}</Pill>
          <h1 className="text-[28px] leading-tight font-bold text-[#302C2A]">
            {report.examTitle}
          </h1>
          <p className="text-[13px] text-[#77716e]">
            {report.examIdentity} · Ngày thi {report.takenAt} · Thời gian làm
            bài {report.durationLabel}
          </p>
        </header>

        <section
          aria-label="Tổng hợp điểm TOEIC L&R"
          className="grid gap-5 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs sm:p-8 lg:grid-cols-[1.2fr_1fr_1fr]"
        >
          <div className="flex flex-col justify-between gap-3 rounded-2xl border-2 border-[#EA580C] bg-[#FFF7ED] p-6">
            <p className="text-xs font-bold tracking-wide text-[#C2410C]">
              TỔNG ĐIỂM TOEIC L&amp;R
            </p>
            <p className="text-5xl font-bold tabular-nums text-[#EA580C]">
              {report.totalScore}
              <span className="text-2xl font-semibold text-[#9A3412]">
                {" "}
                / {report.maxScore}
              </span>
            </p>
            {report.targetScore !== undefined ? (
              <p
                className={`inline-flex w-fit items-center rounded-lg border px-3 py-1 text-xs font-semibold ${
                  reached
                    ? "border-[#10B981] bg-[#ECFDF5] text-[#047857]"
                    : "border-[#F59E0B] bg-[#FEF3C7] text-[#B45309]"
                }`}
              >
                {reached
                  ? `✓ Đạt mục tiêu đề ra (Mục tiêu ${report.targetScore})`
                  : `Mục tiêu ${report.targetScore} · Còn ${report.targetScore - report.totalScore} điểm`}
              </p>
            ) : (
              <p className="text-xs font-medium text-[#9A3412]">
                Thang điểm quy đổi chuẩn ETS (10-990)
              </p>
            )}
          </div>

          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#3B82F6] bg-[#EFF6FF] p-6">
            <p className="text-xs font-bold tracking-wide text-[#1D4ED8]">
              LISTENING SCORE
            </p>
            <p className="text-4xl font-bold tabular-nums text-[#1E40AF]">
              {report.listening.score}
              <span className="text-xl font-semibold text-[#1D4ED8]">
                {" "}
                / {report.listening.max}
              </span>
            </p>
            <p className="text-[13px] font-medium text-[#2563EB]">
              {report.listeningRaw.correct} / {report.listeningRaw.total} câu
              đúng (Độ chính xác {listeningAccuracy}%)
            </p>
          </div>

          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#10B981] bg-[#ECFDF5] p-6">
            <p className="text-xs font-bold tracking-wide text-[#047857]">
              READING SCORE
            </p>
            <p className="text-4xl font-bold tabular-nums text-[#065F46]">
              {report.reading.score}
              <span className="text-xl font-semibold text-[#047857]">
                {" "}
                / {report.reading.max}
              </span>
            </p>
            <p className="text-[13px] font-medium text-[#059669]">
              {report.readingRaw.correct} / {report.readingRaw.total} câu đúng
              (Độ chính xác {readingAccuracy}%)
            </p>
          </div>
        </section>

        <section
          aria-labelledby="part-performance"
          className="flex flex-col gap-5 rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8"
        >
          <h2
            className="text-base font-bold tracking-wide text-[#0F172A]"
            id="part-performance"
          >
            ĐÁNH GIÁ NĂNG LỰC THEO 7 PARTS (ETS RUBRIC)
          </h2>

          {listeningParts.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              <h3 className="text-xs font-bold tracking-wide text-[#1D4ED8]">
                LISTENING SECTION ({report.listeningRaw.total} CÂU)
              </h3>
              <ul className="flex flex-col gap-2.5">
                {listeningParts.map((result) => (
                  <PartPerformanceRow
                    barColor="accent-[#2563EB] [&::-webkit-progress-value]:bg-[#2563EB] [&::-moz-progress-bar]:bg-[#2563EB]"
                    key={result.part}
                    result={result}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {readingParts.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              <h3 className="text-xs font-bold tracking-wide text-[#047857]">
                READING SECTION ({report.readingRaw.total} CÂU)
              </h3>
              <ul className="flex flex-col gap-2.5">
                {readingParts.map((result) => (
                  <PartPerformanceRow
                    barColor="accent-[#059669] [&::-webkit-progress-value]:bg-[#059669] [&::-moz-progress-bar]:bg-[#059669]"
                    key={result.part}
                    result={result}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link className={primaryButton} href={reviewHref}>
            Xem lại bài làm &amp; giải thích
          </Link>
          <Link className={secondaryButton} href={examHref}>
            Làm lại đề này
          </Link>
          <Link className={secondaryButton} href="/history">
            Về lịch sử làm bài
          </Link>
        </div>
      </main>
    </div>
  );
}
