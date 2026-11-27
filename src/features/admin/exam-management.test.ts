import { describe, expect, it } from "vitest";
import { parseReadingExamPage, parseReadingRevision } from "./exam-management";

describe("exam API response parsing", () => {
  it("accepts seeded GUIDs and historical Superseded revisions", () => {
    const revision = {
      examId: "b1000000-0000-0000-0000-000000000001",
      revisionId: "b2000000-0000-0000-0000-000000000001",
      scoreProfileId: "a0000000-0000-0000-0000-000000000001",
      code: "SEED",
      title: "Seed exam",
      versionNumber: 1,
      status: "Superseded",
      blocks: [],
    };
    expect(parseReadingRevision(revision)).toEqual(revision);
    expect(
      parseReadingExamPage({
        items: [
          {
            ...revision,
            status: "Published",
            createdAtUtc: "2026-11-23T00:00:00Z",
          },
        ],
        pageNumber: 1,
        pageSize: 20,
        totalCount: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }).items[0]?.examId,
    ).toBe(revision.examId);
    expect(() =>
      parseReadingRevision({ ...revision, examId: "invalid" }),
    ).toThrow();
  });
  it.each(["Draft", "Published", "Superseded"])(
    "accepts zero-padded IDs in %s exam lists and revisions",
    (status) => {
      const item = {
        examId: "00000000-0000-0000-0000-000000000001",
        revisionId: "00000000-0000-0000-0000-000000000002",
        code: "LR-SEEDED",
        title: "Seeded exam",
        versionNumber: 1,
        status,
        createdAtUtc: "2026-11-24T00:00:00Z",
      };
      expect(
        parseReadingExamPage({
          items: [item],
          pageNumber: 1,
          pageSize: 20,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        }).items[0],
      ).toEqual(item);
      expect(
        parseReadingRevision({
          ...item,
          scoreProfileId: "00000000-0000-0000-0000-000000000003",
          blocks: [],
        }).status,
      ).toBe(status);
    },
  );

  it("accepts the paginated Reading exam response returned by the existing backend", () => {
    expect(
      parseReadingExamPage({
        items: [
          {
            examId: "5db1ff4b-7c02-4073-8d68-4c8405b6d44f",
            code: "LR-2026-001",
            title: "Reading placement test",
            revisionId: "dcd47375-d533-4f23-931c-a9a5bb6f128d",
            versionNumber: 1,
            status: "Draft",
            createdAtUtc: "2026-10-28T00:00:00+00:00",
          },
        ],
        pageNumber: 1,
        pageSize: 20,
        totalCount: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }),
    ).toMatchObject({ totalCount: 1, items: [{ code: "LR-2026-001" }] });
  });

  it("parses revision blocks with audioDurationMs and omits legacy master-audio flags", () => {
    const base = {
      examId: "5db1ff4b-7c02-4073-8d68-4c8405b6d44f",
      code: "LR-2026-001",
      title: "L&R test",
      revisionId: "dcd47375-d533-4f23-931c-a9a5bb6f128d",
      versionNumber: 1,
      status: "Draft",
      scoreProfileId: "5db1ff4b-7c02-4073-8d68-4c8405b6d44f",
      blocks: [
        {
          key: "P1-Q1",
          part: 1,
          type: "Single",
          firstQuestionNumber: 1,
          audioAssetId: "11111111-1111-4111-8111-111111111111",
          audioDurationMs: 18500,
          contextBlocks: [],
          questions: [
            {
              number: 1,
              code: "P1-001",
              stem: "Question",
              optionA: "A",
              optionB: "B",
              optionC: "C",
              optionD: "D",
              correctKey: "A",
              translation: null,
              explanation: null,
              imageAssetId: null,
              imageRequired: false,
            },
          ],
        },
        {
          key: "P2-Q7",
          part: 2,
          type: "Single",
          firstQuestionNumber: 7,
          audioAssetId: null,
          audioDurationMs: null,
          contextBlocks: [],
          questions: [
            {
              number: 7,
              code: "P2-007",
              stem: "Question 7",
              optionA: "A",
              optionB: "B",
              optionC: "C",
              optionD: null,
              correctKey: "A",
              translation: null,
              explanation: null,
              imageAssetId: null,
              imageRequired: false,
            },
          ],
        },
      ],
    };

    const parsed = parseReadingRevision(base);
    expect("hasMasterAudio" in parsed).toBe(false);
    expect("usesMediaWorkspace" in parsed).toBe(false);
    expect(parsed.blocks[0]?.audioDurationMs).toBe(18500);
    expect(parsed.blocks[1]?.audioDurationMs).toBeNull();
  });

  it("rejects revision blocks with invalid non-numeric audioDurationMs", () => {
    expect(() =>
      parseReadingRevision({
        examId: "5db1ff4b-7c02-4073-8d68-4c8405b6d44f",
        code: "LR-2026-001",
        title: "L&R test",
        revisionId: "dcd47375-d533-4f23-931c-a9a5bb6f128d",
        versionNumber: 1,
        status: "Draft",
        scoreProfileId: "5db1ff4b-7c02-4073-8d68-4c8405b6d44f",
        blocks: [
          {
            key: "P1-Q1",
            part: 1,
            type: "Single",
            firstQuestionNumber: 1,
            audioAssetId: null,
            audioDurationMs: "18500",
            contextBlocks: [],
            questions: [],
          },
        ],
      }),
    ).toThrow();
  });
});
