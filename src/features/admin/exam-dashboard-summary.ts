import type { ReadingExamListItem, ScoreProfile } from "./exam-management";

export type { ReadingExamListItem, ScoreProfile } from "./exam-management";

export function summarizeExamDashboard(
  exams: readonly ReadingExamListItem[],
  scoreProfiles: readonly ScoreProfile[],
) {
  return {
    publishedCount: exams.filter((exam) => exam.status === "Published").length,
    draftCount: exams.filter((exam) => exam.status === "Draft").length,
    readyScoreProfileCount: scoreProfiles.filter(
      (profile) => profile.isComplete,
    ).length,
  };
}
