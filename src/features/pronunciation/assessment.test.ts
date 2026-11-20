import { describe, expect, it } from "vitest";
import {
  heardDifferentWord,
  InvalidAssessmentError,
  parseAssessment,
  scoreBand,
  scoreTargetPhoneme,
  type PronunciationAssessment,
} from "./assessment";
import { findSound } from "./ipa-sounds";

const think = {
  recognitionStatus: "Recognized",
  referenceText: "think",
  recognizedText: "think",
  accuracyScore: 78,
  pronunciationScore: 80.5,
  completenessScore: 100,
  words: [
    {
      word: "think",
      accuracyScore: 78,
      errorType: "None",
      phonemes: [
        {
          phoneme: "θ",
          accuracyScore: 54,
          candidates: [
            { phoneme: "s", score: 71 },
            { phoneme: "θ", score: 54 },
          ],
        },
        { phoneme: "ɪ", accuracyScore: 92, candidates: [] },
        { phoneme: "ŋ", accuracyScore: 88, candidates: [] },
        { phoneme: "k", accuracyScore: 95, candidates: [] },
      ],
    },
  ],
};

function word(phonemes: [string, number][]): PronunciationAssessment {
  return parseAssessment({
    ...think,
    words: [
      {
        word: "x",
        accuracyScore: 50,
        phonemes: phonemes.map(([phoneme, accuracyScore]) => ({
          phoneme,
          accuracyScore,
        })),
      },
    ],
  });
}

describe("parseAssessment", () => {
  it("accepts a valid body", () => {
    const result = parseAssessment(think);
    expect(result.words[0].phonemes).toHaveLength(4);
    expect(result.pronunciationScore).toBe(80.5);
  });

  it("accepts NoSpeech with no words", () => {
    const result = parseAssessment({
      ...think,
      recognitionStatus: "NoSpeech",
      recognizedText: null,
      accuracyScore: 0,
      pronunciationScore: 0,
      completenessScore: 0,
      words: [],
    });
    expect(result.recognitionStatus).toBe("NoSpeech");
    expect(result.recognizedText).toBe("");
  });

  it.each([
    null,
    [],
    { ...think, recognitionStatus: "Maybe" },
    { ...think, accuracyScore: "78" },
    { ...think, words: {} },
    { ...think, words: [{ word: "think", accuracyScore: 1, phonemes: [1] }] },
  ])("rejects malformed data %#", (value) => {
    expect(() => parseAssessment(value)).toThrow(InvalidAssessmentError);
  });
});

describe("scoreTargetPhoneme", () => {
  it("scores a single-symbol sound and reports what was heard instead", () => {
    const result = scoreTargetPhoneme(
      parseAssessment(think),
      findSound("th-voiceless")!,
    );
    expect(result).toEqual({ score: 54, indexes: [0], heardInstead: "s" });
  });

  it("averages a multi-symbol sound", () => {
    const result = scoreTargetPhoneme(
      word([
        ["h", 90],
        ["ɪ", 70],
        ["ɹ", 50],
      ]),
      findSound("ie")!,
    );
    expect(result?.score).toBe(60);
    expect(result?.indexes).toEqual([1, 2]);
  });

  it("takes the weakest occurrence of a repeated sound", () => {
    const result = scoreTargetPhoneme(
      word([
        ["p", 90],
        ["eɪ", 80],
        ["p", 40],
        ["ɚ", 70],
      ]),
      findSound("p")!,
    );
    expect(result?.score).toBe(40);
    expect(result?.indexes).toEqual([2]);
  });

  it("matches ASCII g against the IPA letter", () => {
    expect(scoreTargetPhoneme(word([["ɡ", 66]]), findSound("g")!)?.score).toBe(
      66,
    );
  });

  it("returns null when the sound is missing", () => {
    expect(
      scoreTargetPhoneme(word([["k", 90]]), findSound("th-voiced")!),
    ).toBeNull();
  });
});

describe("scoreBand", () => {
  it.each([
    [59, "weak"],
    [60, "fair"],
    [79, "fair"],
    [80, "good"],
  ] as const)("%d → %s", (value, band) => {
    expect(scoreBand(value)).toBe(band);
  });
});

describe("heardDifferentWord", () => {
  it("ignores case and punctuation", () => {
    expect(
      heardDifferentWord({
        ...parseAssessment(think),
        recognizedText: "Think.",
      }),
    ).toBe(false);
    expect(
      heardDifferentWord({ ...parseAssessment(think), recognizedText: "sink" }),
    ).toBe(true);
    expect(
      heardDifferentWord({ ...parseAssessment(think), recognizedText: "" }),
    ).toBe(false);
  });
});
