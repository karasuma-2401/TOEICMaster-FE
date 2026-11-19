// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/features/admin/audio-metadata", () => ({
  readAudioDurationMs: vi.fn(),
}));
vi.mock("@/features/admin/exam-api", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/features/admin/exam-api")>();
  return {
    ...original,
    getReadingRevision: vi.fn(),
    createMediaUploadIntent: vi.fn(),
    uploadFileToMediaIntent: vi.fn(),
    completeMediaUploadIntent: vi.fn(),
  };
});

import { readAudioDurationMs } from "@/features/admin/audio-metadata";
import {
  completeMediaUploadIntent,
  createMediaUploadIntent,
  getReadingRevision,
  uploadFileToMediaIntent,
} from "@/features/admin/exam-api";
import type { ReadingRevision } from "@/features/admin/exam-management";
import { ReadingExamWorkspace } from "./reading-exam-workspace";

const EXAM_ID = "11111111-1111-4111-8111-111111111111";
const REVISION_ID = "22222222-2222-4222-8222-222222222222";
const SCORE_PROFILE_ID = "33333333-3333-4333-8333-333333333333";

function makeRevision(): ReadingRevision {
  return {
    examId: EXAM_ID,
    code: "LR-2026-01",
    title: "ETS 2026 Test 01",
    revisionId: REVISION_ID,
    versionNumber: 1,
    status: "Draft",
    scoreProfileId: SCORE_PROFILE_ID,
    blocks: [
      {
        key: "P1-Q1",
        part: 1,
        type: "Single",
        firstQuestionNumber: 1,
        audioAssetId: "44444444-4444-4444-8444-444444444444",
        audioDurationMs: 18_000,
        contextBlocks: [],
        questions: [
          {
            number: 1,
            code: "P1-001",
            stem: "Look at the picture.",
            optionA: "A",
            optionB: "B",
            optionC: "C",
            optionD: "D",
            correctKey: "A",
            translation: null,
            explanation: null,
            imageAssetId: null,
            imageRequired: true,
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
            stem: "Where is the meeting?",
            optionA: "Room A",
            optionB: "At noon",
            optionC: "Yesterday",
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
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getReadingRevision).mockResolvedValue(makeRevision());
  vi.mocked(readAudioDurationMs).mockResolvedValue(24_000);
  vi.mocked(createMediaUploadIntent).mockResolvedValue({
    intentId: "55555555-5555-4555-8555-555555555555",
    uploadUrl: "https://minio.example.test/upload",
    expiresAtUtc: "2026-11-19T12:00:00Z",
    requiredHeaders: { "Content-Type": "audio/mpeg" },
  });
  vi.mocked(uploadFileToMediaIntent).mockResolvedValue();
  vi.mocked(completeMediaUploadIntent).mockResolvedValue({
    id: "66666666-6666-4666-8666-666666666666",
    contentType: "audio/mpeg",
    kind: "Audio",
    byteSize: 2048,
    durationMs: 24_000,
  });
});

afterEach(cleanup);

describe("ReadingExamWorkspace presigned media & durationMs", () => {
  it("displays per-block and total Listening duration and removes legacy master-audio UI", async () => {
    render(<ReadingExamWorkspace examId={EXAM_ID} revisionId={REVISION_ID} />);

    await screen.findByText("Listening Media");
    expect(screen.getByText(/00:18/)).toBeInTheDocument();
    expect(screen.queryByText(/master audio/i)).not.toBeInTheDocument();
  });

  it("extracts durationMs via readAudioDurationMs and forwards it to createMediaUploadIntent", async () => {
    render(<ReadingExamWorkspace examId={EXAM_ID} revisionId={REVISION_ID} />);

    const audioInput = await screen.findByLabelText("Tải audio");
    const file = new File(["mp3"], "p2-q7.mp3", { type: "audio/mpeg" });
    fireEvent.change(audioInput, { target: { files: [file] } });

    await waitFor(() => expect(readAudioDurationMs).toHaveBeenCalledWith(file));
    await waitFor(() =>
      expect(createMediaUploadIntent).toHaveBeenCalledWith(
        EXAM_ID,
        REVISION_ID,
        expect.objectContaining({
          ownerKind: "AudioGroup",
          ownerKey: "P2-Q7",
          contentType: "audio/mpeg",
          byteSize: file.size,
          durationMs: 24_000,
        }),
      ),
    );
    expect(uploadFileToMediaIntent).toHaveBeenCalled();
    expect(completeMediaUploadIntent).toHaveBeenCalled();
  });

  it("uses presigned QuestionImage upload intent for question images", async () => {
    vi.mocked(createMediaUploadIntent).mockResolvedValueOnce({
      intentId: "77777777-7777-4777-8777-777777777777",
      uploadUrl: "https://minio.example.test/upload-img",
      expiresAtUtc: "2026-11-19T12:00:00Z",
      requiredHeaders: { "Content-Type": "image/png" },
    });
    vi.mocked(completeMediaUploadIntent).mockResolvedValueOnce({
      id: "88888888-8888-4888-8888-888888888888",
      contentType: "image/png",
      kind: "Image",
      byteSize: 1024,
      durationMs: null,
    });

    render(<ReadingExamWorkspace examId={EXAM_ID} revisionId={REVISION_ID} />);

    const imageInput = await screen.findByLabelText("Tải ảnh minh họa");
    const imageFile = new File(["png"], "q1.png", { type: "image/png" });
    fireEvent.change(imageInput, { target: { files: [imageFile] } });

    await waitFor(() =>
      expect(createMediaUploadIntent).toHaveBeenCalledWith(
        EXAM_ID,
        REVISION_ID,
        expect.objectContaining({
          ownerKind: "QuestionImage",
          contentType: "image/png",
          byteSize: imageFile.size,
        }),
      ),
    );
    expect(uploadFileToMediaIntent).toHaveBeenCalled();
    expect(completeMediaUploadIntent).toHaveBeenCalled();
  });
});
