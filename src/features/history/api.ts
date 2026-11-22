import {
  getLrAttemptHistory,
  type LrAttemptStatus,
  type LrAttemptHistoryItemApi,
} from "@/features/lr-exam/api";
import {
  getSpeakingAttempts,
  type SpeakingAttemptSummary,
} from "@/features/speaking/api";
import {
  getWritingHistory,
  type WritingAttemptSummaryApi,
} from "@/features/writing/attempt-api";

export type ExamSkillType = "lr" | "speaking" | "writing";
export type UnifiedAttemptStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

export interface UnifiedAttemptItem {
  id: string;
  skill: ExamSkillType;
  examId: string | null;
  code: string;
  title: string;
  modeLabel: string;
  status: UnifiedAttemptStatus;
  score: number | null;
  maxScore: number;
  subScoreLabel: string | null;
  evaluationStatus: string | null;
  timestampUtc: string;
  durationSeconds: number | null;
  resultHref: string | null;
  reviewHref: string | null;
  resumeHref: string | null;
}

export interface UnifiedHistoryResult {
  items: UnifiedAttemptItem[];
  unauthenticatedSkills: ExamSkillType[];
}

const allSkills: ExamSkillType[] = ["lr", "speaking", "writing"];

function isUnauthorized(cause: unknown): boolean {
  return (
    typeof cause === "object" &&
    cause !== null &&
    "status" in cause &&
    (cause as { status?: unknown }).status === 401
  );
}

function lrStatus(status: LrAttemptStatus): UnifiedAttemptStatus {
  if (status === "Completed") return "COMPLETED";
  if (status === "Abandoned") return "ABANDONED";
  return "IN_PROGRESS";
}

function speakingModeLabel(mode: string | null): string {
  if (!mode) return "Speaking";
  if (mode === "FULL") return "Full Speaking Test";
  const part = mode.match(/(\d+)/)?.[1];
  return part ? `Speaking Part ${part}` : "Speaking";
}

function writingModeLabel(mode: string): string {
  if (mode === "FULL") return "Full Writing Test";
  const part = mode.match(/(\d+)/)?.[1];
  return part ? `Writing Part ${part}` : "Writing";
}

function lrSubScoreLabel(item: LrAttemptHistoryItemApi): string | null {
  if (item.listeningScaledScore === null && item.readingScaledScore === null) {
    return null;
  }
  return `L ${item.listeningScaledScore ?? "-"} · R ${item.readingScaledScore ?? "-"}`;
}

export function mapLrAttempt(
  item: LrAttemptHistoryItemApi,
): UnifiedAttemptItem {
  const status = lrStatus(item.status);
  const base = `/exams/lr/attempts/${encodeURIComponent(item.attemptId)}`;
  return {
    id: item.attemptId,
    skill: "lr",
    examId: item.examId,
    code: item.examCode,
    title: item.examTitle,
    modeLabel: "Full Listening & Reading",
    status,
    score: item.totalScaledScore,
    maxScore: 990,
    subScoreLabel: lrSubScoreLabel(item),
    evaluationStatus: null,
    timestampUtc: item.submittedAtUtc ?? item.startedAtUtc,
    durationSeconds: item.durationSeconds,
    resultHref: status === "COMPLETED" ? `${base}/result` : null,
    reviewHref: status === "COMPLETED" ? `${base}/review` : null,
    resumeHref: status === "IN_PROGRESS" ? `${base}/attempt` : null,
  };
}

function unifiedStatusFromAttemptStatus(status: string): UnifiedAttemptStatus {
  if (status === "IN_PROGRESS") return "IN_PROGRESS";
  if (status === "ABANDONED" || status === "EXPIRED") return "ABANDONED";
  return "COMPLETED";
}

export function mapSpeakingAttempt(
  attempt: SpeakingAttemptSummary,
): UnifiedAttemptItem {
  const status = unifiedStatusFromAttemptStatus(attempt.status);
  const base = `/speaking/attempts/${encodeURIComponent(attempt.id)}`;
  return {
    id: attempt.id,
    skill: "speaking",
    examId: attempt.testId ?? attempt.exerciseId,
    code: attempt.testCode,
    title: attempt.testTitle || "Speaking Practice",
    modeLabel: speakingModeLabel(attempt.mode),
    status,
    score: attempt.estimatedScore,
    maxScore: 200,
    subScoreLabel: null,
    evaluationStatus: attempt.evaluationStatus,
    timestampUtc: attempt.submittedAtUtc ?? attempt.createdAtUtc,
    durationSeconds: null,
    resultHref: status === "COMPLETED" ? base : null,
    reviewHref: status === "COMPLETED" ? `${base}/review/1` : null,
    resumeHref: status === "IN_PROGRESS" ? base : null,
  };
}

export function mapWritingAttempt(
  attempt: WritingAttemptSummaryApi,
): UnifiedAttemptItem {
  const status = unifiedStatusFromAttemptStatus(attempt.status);
  const base = `/writing/attempts/${encodeURIComponent(attempt.id)}`;
  const fullTest = attempt.mode === "FULL" && !attempt.isPractice;
  return {
    id: attempt.id,
    skill: "writing",
    examId: attempt.testId,
    code: attempt.testCode,
    title: attempt.testTitle,
    modeLabel: writingModeLabel(attempt.mode),
    status,
    score: fullTest ? attempt.estimatedScore : (attempt.rawScore ?? null),
    maxScore: fullTest
      ? 200
      : (attempt.maxRawScore ??
        attempt.questionCount *
          (attempt.mode === "PART_1" ? 3 : attempt.mode === "PART_2" ? 4 : 5)),
    subScoreLabel: fullTest ? null : "Điểm tiêu chí AI",
    evaluationStatus: attempt.evaluationStatus,
    timestampUtc: attempt.submittedAtUtc ?? attempt.createdAtUtc,
    durationSeconds: null,
    resultHref: status === "COMPLETED" ? `${base}/result` : null,
    reviewHref: status === "COMPLETED" ? `${base}/review` : null,
    resumeHref: status === "IN_PROGRESS" ? base : null,
  };
}

async function loadSkill(
  skill: ExamSkillType,
  signal?: AbortSignal,
): Promise<UnifiedAttemptItem[]> {
  if (skill === "lr") {
    const page = await getLrAttemptHistory(
      { pageIndex: 1, pageSize: 50 },
      signal,
    );
    return page.items.map(mapLrAttempt);
  }
  if (skill === "speaking") {
    return (await getSpeakingAttempts(signal)).map(mapSpeakingAttempt);
  }
  return (await getWritingHistory(signal)).map(mapWritingAttempt);
}

/** Merges attempts from every requested skill, newest first. */
export async function fetchUnifiedHistory(
  options: { skills?: ExamSkillType[]; signal?: AbortSignal } = {},
): Promise<UnifiedHistoryResult> {
  const skills = options.skills?.length ? options.skills : allSkills;
  const settled = await Promise.all(
    skills.map(async (skill) => {
      try {
        return { skill, items: await loadSkill(skill, options.signal) };
      } catch (cause) {
        if (options.signal?.aborted) throw cause;
        if (isUnauthorized(cause))
          return { skill, items: [], unauthorized: true };
        throw cause;
      }
    }),
  );

  const items = settled
    .flatMap((entry) => entry.items)
    .sort((a, b) => Date.parse(b.timestampUtc) - Date.parse(a.timestampUtc));

  return {
    items,
    unauthenticatedSkills: settled
      .filter((entry) => entry.unauthorized)
      .map((entry) => entry.skill),
  };
}
