import { describe, expect, it } from "vitest";
import { parseReadingExamPage, parseReadingRevision } from "./exam-management";

describe("exam API response parsing", () => {
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

  it("keeps legacy revisions on the master-audio flow and accepts new media workspaces", () => {
    const base = {
      examId: "5db1ff4b-7c02-4073-8d68-4c8405b6d44f",
      code: "LR-2026-001",
      title: "L&R test",
      revisionId: "dcd47375-d533-4f23-931c-a9a5bb6f128d",
      versionNumber: 1,
      status: "Draft",
      scoreProfileId: "5db1ff4b-7c02-4073-8d68-4c8405b6d44f",
      hasMasterAudio: true,
      blocks: [
        {
          key: "P1-Q1",
          part: 1,
          type: "Single",
          firstQuestionNumber: 1,
          audioAssetId: null,
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
      ],
    };

    expect(
      parseReadingRevision({ ...base, usesMediaWorkspace: false }),
    ).toMatchObject({
      hasMasterAudio: true,
      usesMediaWorkspace: false,
    });
    expect(
      parseReadingRevision({ ...base, usesMediaWorkspace: true }),
    ).toMatchObject({
      usesMediaWorkspace: true,
      blocks: [{ audioAssetId: null }],
    });
  });
});
