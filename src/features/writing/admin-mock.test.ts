import { beforeEach, describe, expect, it } from "vitest";
import {
  createAdminTestDraft,
  getAdminQuestions,
  resetAdminMockRepository,
  saveAdminQuestion,
  validateTestForPublish,
} from "./admin-mock";

describe("Writing admin mock repository", () => {
  beforeEach(() => {
    resetAdminMockRepository();
  });

  it("creates a full draft with the Writing 5/2/1 structure", () => {
    for (let i = 1; i <= 5; i++) {
      saveAdminQuestion({
        id: `wp1-${i}`,
        code: `WP1-${i}`,
        part: 1,
        topic: "Công việc",
        difficulty: "Dễ",
        status: "PUBLISHED",
        updatedAtLabel: "Hôm nay",
        imageName: `img-${i}.jpg`,
        imageAlt: "Alt",
        keywordOne: "word1",
        keywordTwo: "word2",
        rubricNotes: "Notes",
        modelAnswer: "Answer",
      });
    }
    for (let i = 1; i <= 2; i++) {
      saveAdminQuestion({
        id: `wp2-${i}`,
        code: `WP2-${i}`,
        part: 2,
        topic: "Công việc",
        difficulty: "Dễ",
        status: "PUBLISHED",
        updatedAtLabel: "Hôm nay",
        sender: "Sender",
        recipient: "Recipient",
        subject: "Subject",
        emailBody: "Body",
        directions: "Directions",
        rubricNotes: "Notes",
        modelAnswer: "Answer",
      });
    }
    saveAdminQuestion({
      id: "wp3-1",
      code: "WP3-1",
      part: 3,
      topic: "Công việc",
      difficulty: "Khó",
      status: "PUBLISHED",
      updatedAtLabel: "Hôm nay",
      prompt: "Prompt",
      minimumWordCount: 300,
      outline: "Outline",
      rubricNotes: "Notes",
      modelAnswer: "Answer",
    });

    const draft = createAdminTestDraft();

    expect(draft.questionIds[1]).toHaveLength(5);
    expect(draft.questionIds[2]).toHaveLength(2);
    expect(draft.questionIds[3]).toHaveLength(1);
    expect(validateTestForPublish(draft)).toEqual([]);
  });

  it("blocks publishing when the builder has a missing or unpublished slot", () => {
    saveAdminQuestion({
      id: "wp1-draft",
      code: "WP1-DRAFT",
      part: 1,
      topic: "Đời sống",
      difficulty: "Khó",
      status: "DRAFT",
      updatedAtLabel: "Hôm nay",
      imageName: "img.jpg",
      imageAlt: "Alt",
      keywordOne: "word1",
      keywordTwo: "word2",
      rubricNotes: "Notes",
      modelAnswer: "Answer",
    });

    const draft = createAdminTestDraft();
    const unavailable = getAdminQuestions().find(
      (question) => question.part === 1 && question.status !== "PUBLISHED",
    );

    expect(unavailable).toBeDefined();
    draft.questionIds[1] = [unavailable?.id ?? "missing"];

    expect(validateTestForPublish(draft)).toEqual(
      expect.arrayContaining([
        "Part 1 phải có đúng 5 câu.",
        "Part 1 có câu hỏi không hợp lệ hoặc chưa công bố.",
      ]),
    );
  });
});
