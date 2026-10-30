import type { SpeakingContent } from "@/features/speaking/types";
import { DescribePicturePrompt } from "./describe-picture-prompt";
import { InformationPrompt } from "./information-prompt";
import { OpinionPrompt } from "./opinion-prompt";
import { PromptFrame } from "./prompt-frame";
import { ReadAloudPrompt } from "./read-aloud-prompt";
import { RespondQuestionsPrompt } from "./respond-questions-prompt";

/**
 * Renders a Speaking content in TOEIC format. `showAllQuestions` lists every
 * Part 3/4 question at once, which admin previews use.
 */
export function SpeakingPrompt({
  content,
  questionIndex = 0,
  revealQuestion = true,
  showAllQuestions = false,
  showDirections = true,
}: {
  content: SpeakingContent;
  questionIndex?: number;
  revealQuestion?: boolean;
  showAllQuestions?: boolean;
  showDirections?: boolean;
}) {
  return (
    <PromptFrame part={content.part} showDirections={showDirections}>
      {content.part === 1 && <ReadAloudPrompt content={content} />}
      {content.part === 2 && <DescribePicturePrompt content={content} />}
      {content.part === 3 && (
        <RespondQuestionsPrompt
          content={content}
          questionIndex={questionIndex}
          showAllQuestions={showAllQuestions}
        />
      )}
      {content.part === 4 && (
        <InformationPrompt
          content={content}
          questionIndex={questionIndex}
          revealQuestion={revealQuestion}
          showAllQuestions={showAllQuestions}
        />
      )}
      {content.part === 5 && <OpinionPrompt content={content} />}
    </PromptFrame>
  );
}
