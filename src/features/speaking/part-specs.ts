import type { SpeakingPart } from "./types";

export interface SpeakingPartSpec {
  part: SpeakingPart;
  title: string;
  subtitle: string;
  description: string;
  /** On-screen directions shown before each Part, as in the real test. */
  directions: string;
  /** Exercises a full test uses for this Part. */
  slots: number;
  /** Seconds to read the shared document before the first question (Part 4). */
  readingSeconds: number;
  /** Preparation and response seconds per question inside one exercise. */
  preparationSeconds: number[];
  responseSeconds: number[];
}

// Timing follows the public TOEIC Speaking format (11 questions, ~20 minutes).
export const speakingPartSpecs: Record<SpeakingPart, SpeakingPartSpec> = {
  1: {
    part: 1,
    title: "Read a text aloud",
    subtitle: "Read a text aloud",
    description:
      "Read aloud a short announcement or advertisement shown on screen.",
    directions:
      "In this part of the test, you will read aloud the text on the screen. You will have 45 seconds to prepare. Then you will have 45 seconds to read the text aloud.",
    slots: 2,
    readingSeconds: 0,
    preparationSeconds: [45],
    responseSeconds: [45],
  },
  2: {
    part: 2,
    title: "Describe a picture",
    subtitle: "Describe a picture",
    description:
      "Describe the people, objects, and activities in the photo in detail.",
    directions:
      "In this part of the test, you will describe the picture on your screen in as much detail as you can. You will have 45 seconds to prepare your response. Then you will have 30 seconds to speak about the picture.",
    slots: 2,
    readingSeconds: 0,
    preparationSeconds: [45],
    responseSeconds: [30],
  },
  3: {
    part: 3,
    title: "Respond to questions",
    subtitle: "Respond to questions",
    description:
      "Answer three short questions about a familiar everyday topic.",
    directions:
      "In this part of the test, you will answer three questions. You will have three seconds to prepare after you hear each question. You will have 15 seconds to respond to the first two questions and 30 seconds to respond to the third question.",
    slots: 1,
    readingSeconds: 0,
    preparationSeconds: [3, 3, 3],
    responseSeconds: [15, 15, 30],
  },
  4: {
    part: 4,
    title: "Respond using information",
    subtitle: "Respond using information",
    description: "Read a schedule or program, then answer three questions.",
    directions:
      "In this part of the test, you will answer three questions based on the information provided. You will have 45 seconds to read the information before the questions begin. You will have three seconds to prepare and 15 seconds to respond to the first two questions, and 30 seconds to respond to the third question.",
    slots: 1,
    readingSeconds: 45,
    preparationSeconds: [3, 3, 3],
    responseSeconds: [15, 15, 30],
  },
  5: {
    part: 5,
    title: "Express an opinion",
    subtitle: "Express an opinion",
    description:
      "Present your personal opinion with specific reasons and examples.",
    directions:
      "In this part of the test, you will give your opinion about a specific topic. Be sure to say as much as you can in the time allowed. You will have 45 seconds to prepare. Then you will have 60 seconds to speak.",
    slots: 1,
    readingSeconds: 0,
    preparationSeconds: [45],
    responseSeconds: [60],
  },
};

export function questionsPerExercise(part: SpeakingPart) {
  return speakingPartSpecs[part].responseSeconds.length;
}

export function partQuestionCount(part: SpeakingPart) {
  return speakingPartSpecs[part].slots * questionsPerExercise(part);
}

/** Total speaking time for one full Part, including reading and preparation. */
export function partDurationSeconds(part: SpeakingPart) {
  const spec = speakingPartSpecs[part];
  const perExercise =
    spec.readingSeconds +
    spec.preparationSeconds.reduce((total, value) => total + value, 0) +
    spec.responseSeconds.reduce((total, value) => total + value, 0);
  return perExercise * spec.slots;
}

export function partTimingLabel(part: SpeakingPart) {
  const spec = speakingPartSpecs[part];
  const unique = (values: number[]) =>
    [...new Set(values)].map((value) => `${value}s`).join("/");
  const reading = spec.readingSeconds ? `Read ${spec.readingSeconds}s · ` : "";
  return `${reading}Prep ${unique(spec.preparationSeconds)} · Respond ${unique(spec.responseSeconds)}`;
}
