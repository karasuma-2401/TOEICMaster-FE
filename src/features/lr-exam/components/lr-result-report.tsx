import Link from "next/link";
import { LR_PARTS } from "../parts";
import type { LrResultReport } from "../types";
import { LearnerNav, Pill, primaryButton, secondaryButton } from "./exam-ui";

export interface LrResultReportViewProps {
  report: LrResultReport;
  examHref: string;
  reviewHref: string;
}

function ScoreBar({
  label,
  score,
  max,
}: {
  label: string;
  score: number;
  max: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-[13px]">
        <span>{label}</span>
        <span className="font-semibold">
          {score} / {max}
        </span>
      </div>
      <progress
        aria-label={label}
        className="h-2 w-full accent-[#ff5a1f]"
        max={max}
        value={score}
      />
    </div>
  );
}

export function LrResultReportView({
  report,
  examHref,
  reviewHref,
}: LrResultReportViewProps) {
  const reached =
    report.targetScore !== undefined && report.totalScore >= report.targetScore;
  return (
    <div className="min-h-screen bg-[#faf7f5] text-[#4c4542]">
      <LearnerNav />
      <main className="mx-auto flex max-w-[1100px] flex-col gap-6 px-4 py-10 sm:px-8">
        <header className="flex flex-col gap-2">
          <Pill>BÁO CÁO KẾT QUẢ · {report.scale}</Pill>
          <h1 className="text-[28px] leading-tight font-bold">
            {report.examTitle}
          </h1>
          <p className="text-[13px] text-[#77716e]">
            {report.examIdentity} · Ngày thi {report.takenAt} · Thời gian làm
            bài {report.durationLabel}
          </p>
        </header>

        <section
          aria-label="Điểm tổng"
          className="grid gap-6 rounded-2xl border border-[#eee9e6] bg-white p-6 sm:p-8 md:grid-cols-[280px_1fr]"
        >
          <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-[#fff7ed] p-6 text-center">
            <p className="text-[13px] text-[#77716e]">Tổng điểm</p>
            <p className="text-6xl font-bold text-[#ff5a1f]">
              {report.totalScore}
            </p>
            <p className="text-[13px] text-[#77716e]">/ {report.maxScore}</p>
          </div>
          <div className="flex flex-col justify-center gap-5">
            <ScoreBar
              label="Listening"
              max={report.listening.max}
              score={report.listening.score}
            />
            <ScoreBar
              label="Reading"
              max={report.reading.max}
              score={report.reading.score}
            />
          </div>
        </section>

        <section
          aria-labelledby="part-performance"
          className="flex flex-col gap-4 rounded-2xl border border-[#eee9e6] bg-white p-6 sm:p-8"
        >
          <h2 className="text-lg font-semibold" id="part-performance">
            Hiệu suất theo Part
          </h2>
          <ul className="grid gap-4 md:grid-cols-2">
            {report.parts.map((result) => {
              const spec = LR_PARTS.find((part) => part.id === result.part);
              return (
                <li key={result.part}>
                  <ScoreBar
                    label={`Part ${result.part}: ${spec?.reportTitle ?? ""}`}
                    max={result.total}
                    score={result.correct}
                  />
                </li>
              );
            })}
          </ul>
        </section>

        {report.targetScore !== undefined ? (
          <section
            className={
              reached
                ? "flex flex-col gap-1 rounded-2xl bg-[#e5f4ec] p-6 text-[#398565]"
                : "flex flex-col gap-1 rounded-2xl bg-[#fef3c7] p-6 text-[#d97706]"
            }
          >
            <h2 className="text-lg font-semibold">
              {reached
                ? "Chúc mừng! Bạn đã đạt mục tiêu"
                : "Cố lên! Sắp đạt mục tiêu"}
            </h2>
            <p className="text-[13px]">
              Điểm mục tiêu {report.targetScore} · Bạn đạt {report.totalScore}{" "}
              điểm.
            </p>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Link className={primaryButton} href={reviewHref}>
            Xem lại bài làm &amp; giải thích
          </Link>
          <Link className={secondaryButton} href={examHref}>
            Làm lại đề này
          </Link>
          <Link className={secondaryButton} href="/">
            Về danh sách đề
          </Link>
        </div>
      </main>
    </div>
  );
}
