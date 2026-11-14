import type {
  LrAnswers,
  LrChoiceKey,
  LrExamSummary,
  LrFlags,
  LrQuestion,
  LrQuestionGroup,
  LrResultReport,
  LrReviewGroup,
  LrReviewQuestionDetail,
  LrReviewStatus,
} from "./types";
import type { LrReviewState, LrRoomState } from "./loaders";
import type { LrResultApi, LrReviewApi, LrSheetApi } from "./api";

const choiceKeys: LrChoiceKey[] = ["A", "B", "C", "D"];

function choices(question: {
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
}) {
  const options = [
    { key: "A" as const, text: question.optionA },
    { key: "B" as const, text: question.optionB },
    { key: "C" as const, text: question.optionC },
    { key: "D" as const, text: question.optionD },
  ];

  return options.flatMap((option) =>
    option.text?.trim() ? [{ key: option.key, text: option.text }] : [],
  );
}

function examSummary(
  sheet: Pick<
    LrSheetApi,
    "examId" | "examCode" | "examTitle" | "totalQuestions" | "timeLimitSeconds"
  >,
): LrExamSummary {
  return {
    id: sheet.examId,
    title: sheet.examTitle,
    identity: sheet.examCode,
    breadcrumb: `Trang chủ / Đề thi thử / ${sheet.examCode}`,
    totalQuestions: sheet.totalQuestions,
    durationMinutes: Math.ceil(sheet.timeLimitSeconds / 60),
    scoreScale: "10–990",
  };
}

export function sheetToRoomState(
  sheet: LrSheetApi,
  mediaUrls: Record<string, string> = {},
): LrRoomState {
  const groups: LrQuestionGroup[] = sheet.blocks.map((block) => {
    const questions: LrQuestion[] = block.questions.map((question) => ({
      number: question.number,
      prompt: question.stem ?? "",
      choices: choices(question),
      ...(question.imageAssetId && mediaUrls[question.imageAssetId]
        ? { imageUrl: mediaUrls[question.imageAssetId] }
        : {}),
    }));
    const contexts = block.contextBlocks
      .filter((context) => context.text || context.imageAssetId)
      .sort((a, b) => a.ordinal - b.ordinal);
    const first = questions[0]?.number ?? block.firstQuestionNumber;
    const last = questions.at(-1)?.number ?? first;

    return {
      id: block.id,
      part: block.part as LrQuestionGroup["part"],
      first,
      last,
      heading: `PART ${block.part} · CÂU ${first}–${last}`,
      description: block.part <= 4 ? "Listening" : "Reading",
      ...(contexts.length > 0
        ? {
            passage: {
              label: `PART ${block.part} · CÂU ${first}–${last}`,
              title: `Nội dung Part ${block.part}`,
              paragraphs: contexts.map((context) => ({
                text: context.text ?? "",
                ...(context.imageAssetId && mediaUrls[context.imageAssetId]
                  ? { imageUrl: mediaUrls[context.imageAssetId] }
                  : {}),
              })),
            },
          }
        : {}),
      ...(block.audioAssetId && mediaUrls[block.audioAssetId]
        ? { audio: { src: mediaUrls[block.audioAssetId] } }
        : {}),
      questions,
    };
  });

  const answers: LrAnswers = {};
  const flags: LrFlags = {};

  for (const block of sheet.blocks) {
    for (const question of block.questions) {
      if (question.userSelectedKey) {
        answers[question.number] = question.userSelectedKey;
      }
      if (question.isFlagged) {
        flags[question.number] = true;
      }
    }
  }

  const initialNumber = sheet.phase === "reading" ? 101 : 1;

  return {
    exam: examSummary(sheet),
    groups,
    initialNumber,
    initialAnswers: answers,
    initialFlags: flags,
    initialRemainingSeconds: sheet.remainingSeconds,
    attemptId: sheet.attemptId,
    phase: sheet.phase,
    questionIds: Object.fromEntries(
      sheet.blocks.flatMap((block) =>
        block.questions.map(
          (question) => [question.number, question.id] as const,
        ),
      ),
    ),
    masterAudioObjectKey: sheet.masterAudioObjectKey,
  };
}

function durationLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes} phút ${remainder} giây`;
}

export function resultToReport(result: LrResultApi): LrResultReport {
  return {
    examTitle: `Kết quả bài thi Listening & Reading - ${result.examTitle}`,
    examIdentity: result.examCode,
    takenAt: new Date(result.submittedAtUtc).toLocaleDateString("vi-VN"),
    durationLabel: durationLabel(result.durationSeconds),
    scale: "ETS Standard",
    totalScore: result.totalScaledScore,
    maxScore: result.maxScaledScore,
    listening: {
      score: result.listeningScaledScore,
      max: result.listeningMaxScaledScore,
    },
    reading: {
      score: result.readingScaledScore,
      max: result.readingMaxScaledScore,
    },
    parts: result.parts.map((part) => ({
      part: part.part as LrResultReport["parts"][number]["part"],
      correct: part.correctCount,
      total: part.totalQuestions,
    })),
  };
}

export function reviewToState(
  review: LrReviewApi,
  mediaUrls: Record<string, string> = {},
): LrReviewState {
  const statuses: Record<number, LrReviewStatus> = {};
  const flags: LrFlags = {};

  const groups: LrReviewGroup[] = review.blocks.map((block) => {
    const questions: LrReviewQuestionDetail[] = block.questions.map(
      (question) => {
        const correct = question.correctKey;
        if (!choiceKeys.includes(correct as LrChoiceKey)) {
          throw new Error(
            `Thiếu đáp án đúng cho câu ${question.number} trong dữ liệu review.`,
          );
        }

        const selected = question.userSelectedKey;
        if (
          selected !== null &&
          !choiceKeys.includes(selected as LrChoiceKey)
        ) {
          throw new Error(
            `Đáp án đã chọn của câu ${question.number} không hợp lệ.`,
          );
        }

        statuses[question.number] = question.status;
        if (question.isFlagged) flags[question.number] = true;

        return {
          number: question.number,
          prompt: question.stem ?? "",
          choices: choices(question),
          ...(question.imageAssetId && mediaUrls[question.imageAssetId]
            ? { imageUrl: mediaUrls[question.imageAssetId] }
            : {}),
          selected: selected ? (selected as LrChoiceKey) : undefined,
          correct: correct as LrChoiceKey,
          analysis: {
            summary:
              question.explanation ??
              "Chưa có lời giải chi tiết cho câu hỏi này.",
            ...(question.translation ? { notes: [question.translation] } : {}),
            skill: `Listening & Reading · Part ${question.part}`,
          },
        };
      },
    );

    const contexts = block.contextBlocks
      .filter((context) => context.text || context.imageAssetId)
      .sort((a, b) => a.ordinal - b.ordinal);

    return {
      id: block.id,
      ...(contexts.length > 0
        ? {
            passage: {
              label: `PART ${block.part}`,
              title: `Nội dung Part ${block.part}`,
              paragraphs: contexts.map((context) => ({
                text: context.text ?? "",
                ...(context.imageAssetId && mediaUrls[context.imageAssetId]
                  ? { imageUrl: mediaUrls[context.imageAssetId] }
                  : {}),
              })),
            },
          }
        : {}),
      questions,
    };
  });

  return {
    exam: {
      id: review.examId,
      title: review.examTitle,
      identity: review.examCode,
      breadcrumb: `Trang chủ / Đề thi thử / ${review.examCode}`,
      totalQuestions: 200,
      durationMinutes: 120,
      scoreScale: "10–990",
    },
    groups,
    statuses,
    counts: {
      correct: review.counts.correct,
      wrong: review.counts.wrong,
      skipped: review.counts.skipped,
    },
    flags,
  };
}
