import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  exerciseDtoToQuestion,
  fromApiDifficulty,
  listWritingExercises,
  testDtoToAdminTest,
  toApiDifficulty,
  type WritingExerciseDto,
  type WritingTestDto,
} from "./admin-api";

describe("Admin Writing API Client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps difficulties back and forth", () => {
    expect(toApiDifficulty("Dễ")).toBe("EASY");
    expect(toApiDifficulty("Trung bình")).toBe("MEDIUM");
    expect(toApiDifficulty("Khó")).toBe("HARD");

    expect(fromApiDifficulty("EASY")).toBe("Dễ");
    expect(fromApiDifficulty("MEDIUM")).toBe("Trung bình");
    expect(fromApiDifficulty("HARD")).toBe("Khó");
  });

  it("converts WritingExerciseDto to AdminWritingQuestion correctly", () => {
    const dto: WritingExerciseDto = {
      id: "ex-1",
      part: 1,
      code: "WP1-001",
      topic: "Công việc",
      difficulty: "EASY",
      status: "PUBLISHED",
      rubricNotes: "rubric",
      modelAnswer: "model",
      imageAssetId: "img-123",
      imageAlt: "alt text",
      keywordOne: "write",
      keywordTwo: "report",
      sender: null,
      recipient: null,
      subject: null,
      emailBody: null,
      directions: null,
      prompt: null,
      minimumWordCount: null,
      outline: null,
      version: 1,
      createdAtUtc: "2026-10-31T12:00:00Z",
      updatedAtUtc: "2026-10-31T12:00:00Z",
    };

    const question = exerciseDtoToQuestion(dto);
    expect(question.id).toBe("ex-1");
    expect(question.code).toBe("WP1-001");
    expect(question.part).toBe(1);
    if (question.part === 1) {
      expect(question.keywordOne).toBe("write");
      expect(question.keywordTwo).toBe("report");
      expect(question.imageAssetId).toBe("img-123");
    }
  });

  it("converts WritingTestDto to AdminWritingTest correctly", () => {
    const dto: WritingTestDto = {
      id: "test-1",
      code: "WRT-2026-01",
      title: "Test 1",
      description: "Description",
      status: "PUBLISHED",
      version: 2,
      createdAtUtc: "2026-10-31T12:00:00Z",
      updatedAtUtc: "2026-10-31T12:00:00Z",
      publishedAtUtc: "2026-10-31T12:00:00Z",
      questions: [
        {
          id: "q1",
          exerciseId: "ex-p1",
          part: 1,
          sequenceNumber: 1,
          snapshotJson: null,
        },
        {
          id: "q2",
          exerciseId: "ex-p2",
          part: 2,
          sequenceNumber: 1,
          snapshotJson: null,
        },
        {
          id: "q3",
          exerciseId: "ex-p3",
          part: 3,
          sequenceNumber: 1,
          snapshotJson: null,
        },
      ],
    };

    const adminTest = testDtoToAdminTest(dto);
    expect(adminTest.id).toBe("test-1");
    expect(adminTest.code).toBe("WRT-2026-01");
    expect(adminTest.questionIds[1]).toEqual(["ex-p1"]);
    expect(adminTest.questionIds[2]).toEqual(["ex-p2"]);
    expect(adminTest.questionIds[3]).toEqual(["ex-p3"]);
    expect(adminTest.version).toBe(2);
  });

  it("calls listWritingExercises with query parameters", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [],
          pageNumber: 1,
          pageSize: 10,
          totalCount: 0,
          totalPages: 1,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await listWritingExercises({
      part: 1,
      query: "email",
      difficulty: "EASY",
      status: "PUBLISHED",
      pageNumber: 1,
      pageSize: 10,
    });

    expect(result.items).toEqual([]);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/writing/exercises?"),
      expect.objectContaining({ method: "GET" }),
    );
  });
});
