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
    breadcrumb: `Home / Mock Tests / ${sheet.examCode}`,
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
      heading: `PART ${block.part} · QUESTIONS ${first}–${last}`,
      description: block.part <= 4 ? "Listening" : "Reading",
      ...(contexts.length > 0
        ? {
            passage: {
              label: `PART ${block.part} · QUESTIONS ${first}–${last}`,
              title: `Part ${block.part} Passage`,
              paragraphs: contexts.map((context) => ({
                text: context.text ?? "",
                ...(context.imageAssetId && mediaUrls[context.imageAssetId]
                  ? { imageUrl: mediaUrls[context.imageAssetId] }
                  : {}),
              })),
            },
          }
        : {}),
      ...(block.audioAssetId
        ? {
            audio: {
              assetId: block.audioAssetId,
              durationMs: block.audioDurationMs,
              ...(mediaUrls[block.audioAssetId]
                ? { src: mediaUrls[block.audioAssetId] }
                : {}),
            },
          }
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
  };
}

function durationLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes} minutes ${remainder} seconds`;
}

export function resultToReport(result: LrResultApi): LrResultReport {
  const listeningParts = result.parts.filter((part) => part.part <= 4);
  const readingParts = result.parts.filter((part) => part.part >= 5);
  const listeningPartsTotal = listeningParts.reduce(
    (sum, part) => sum + part.totalQuestions,
    0,
  );
  const readingPartsTotal = readingParts.reduce(
    (sum, part) => sum + part.totalQuestions,
    0,
  );
  const listeningTotal = Math.max(
    listeningParts.length === 4 && listeningPartsTotal > 0
      ? listeningPartsTotal
      : 100,
    result.listeningRawScore,
  );
  const readingTotal = Math.max(
    readingParts.length === 3 && readingPartsTotal > 0
      ? readingPartsTotal
      : 100,
    result.readingRawScore,
  );

  return {
    examTitle: `Listening & Reading Exam Result - ${result.examTitle}`,
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
    listeningRaw: {
      correct: result.listeningRawScore,
      total: listeningTotal,
    },
    readingRaw: {
      correct: result.readingRawScore,
      total: readingTotal,
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
        if (correct !== null && !choiceKeys.includes(correct as LrChoiceKey)) {
          throw new Error(
            `Missing correct answer for question ${question.number} in review data.`,
          );
        }

        const selected = question.userSelectedKey;
        if (
          selected !== null &&
          !choiceKeys.includes(selected as LrChoiceKey)
        ) {
          throw new Error(
            `Selected answer for question ${question.number} is invalid.`,
          );
        }

        statuses[question.number] = question.status;
        if (question.isFlagged) flags[question.number] = true;

        return {
          number: question.number,
          prompt: question.stem?.trim() || "Question content unavailable.",
          choices: choices(question),
          ...(question.imageAssetId && mediaUrls[question.imageAssetId]
            ? { imageUrl: mediaUrls[question.imageAssetId] }
            : {}),
          selected: selected ? (selected as LrChoiceKey) : undefined,
          ...(correct ? { correct: correct as LrChoiceKey } : {}),
          analysis: {
            summary:
              correct === null
                ? "This question has no answer key in the exam data. Ask an administrator to complete it."
                : (question.explanation ??
                  "No detailed explanation is available for this question."),
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
      ...(block.audioAssetId
        ? {
            audio: {
              assetId: block.audioAssetId,
              durationMs: block.audioDurationMs,
            },
          }
        : {}),
      ...(contexts.length > 0
        ? {
            passage: {
              label: `PART ${block.part}`,
              title: `Part ${block.part} Passage`,
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
      breadcrumb: `Home / Mock Tests / ${review.examCode}`,
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
