// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { parseExercise } from "@/features/speaking/parsers";
import { exerciseDto } from "@/features/speaking/testing/fixtures";
import type { InformationContent } from "@/features/speaking/types";
import { SpeakingPrompt } from "./speaking-prompt";

afterEach(cleanup);

const part4 = parseExercise(exerciseDto(4)) as InformationContent & {
  questions: string[];
};

describe("SpeakingPrompt", () => {
  it("keeps Part 4 questions hidden while the learner reads the document", () => {
    render(
      <SpeakingPrompt
        content={part4}
        questionIndex={0}
        revealQuestion={false}
      />,
    );

    expect(screen.getByText(part4.documentTitle)).toBeInTheDocument();
    expect(screen.queryByText(part4.questions[0])).not.toBeInTheDocument();
    expect(
      screen.getByText(/Câu hỏi sẽ hiện khi hết thời gian đọc/),
    ).toBeInTheDocument();
  });

  it("shows only the current question during an attempt", () => {
    render(<SpeakingPrompt content={part4} questionIndex={1} />);

    expect(screen.getByText("Câu hỏi 2/3")).toBeInTheDocument();
    expect(screen.getByText(part4.questions[1])).toBeInTheDocument();
    expect(screen.queryByText(part4.questions[0])).not.toBeInTheDocument();
  });

  it("shows a placeholder for a question the server has not revealed", () => {
    render(
      <SpeakingPrompt
        content={{ ...part4, questions: [null, null, null] }}
        questionIndex={0}
      />,
    );

    expect(
      screen.getByText("Câu hỏi sẽ hiện khi đến lượt."),
    ).toBeInTheDocument();
  });

  it("lists every question for admin previews", () => {
    render(<SpeakingPrompt content={part4} showAllQuestions />);

    for (const question of part4.questions)
      expect(screen.getByText(question)).toBeInTheDocument();
  });
});
