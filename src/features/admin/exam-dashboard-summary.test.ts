import { describe, expect, it } from "vitest";
import {
  summarizeExamDashboard,
  type ReadingExamListItem,
  type ScoreProfile,
} from "./exam-dashboard-summary";

const exams: ReadingExamListItem[] = [
  {
    examId: "11111111-1111-4111-8111-111111111111",
    revisionId: "22222222-2222-4222-8222-222222222222",
    code: "LR-2026-001",
    title: "ETS 2026 Test 01",
    versionNumber: 2,
    status: "Published",
    createdAtUtc: "2026-11-01T00:00:00Z",
  },
  {
    examId: "33333333-3333-4333-8333-333333333333",
    revisionId: "44444444-4444-4444-8444-444444444444",
    code: "LR-2026-002",
    title: "ETS 2026 Test 02",
    versionNumber: 1,
    status: "Draft",
    createdAtUtc: "2026-11-02T00:00:00Z",
  },
];

const profiles: ScoreProfile[] = [
  {
    id: "55555555-5555-4555-8555-555555555555",
    name: "ETS chuẩn",
    isComplete: true,
    mappingCount: 202,
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    name: "Chưa hoàn chỉnh",
    isComplete: false,
    mappingCount: 180,
  },
];

describe("summarizeExamDashboard", () => {
  it("derives the management metrics from live exam and score-profile data", () => {
    expect(summarizeExamDashboard(exams, profiles)).toEqual({
      draftCount: 1,
      publishedCount: 1,
      readyScoreProfileCount: 1,
    });
  });

  it("returns zero metrics when the live collections are empty", () => {
    expect(summarizeExamDashboard([], [])).toEqual({
      draftCount: 0,
      publishedCount: 0,
      readyScoreProfileCount: 0,
    });
  });
});
