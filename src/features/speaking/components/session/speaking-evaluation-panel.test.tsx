// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSpeakingAttempt,
  getSpeakingEvaluationAvailability,
  grantSpeakingEvaluationConsent,
} from "@/features/speaking/api";
import { parseAttempt } from "@/features/speaking/attempt";
import { SpeakingApiError } from "@/features/speaking/http";
import {
  attemptDto,
  evaluationDto,
} from "@/features/speaking/testing/fixtures";
import { SpeakingEvaluationPanel } from "./speaking-evaluation-panel";

vi.mock("@/features/speaking/api", () => ({
  getSpeakingAttempt: vi.fn(),
  getSpeakingEvaluationAvailability: vi.fn(),
  grantSpeakingEvaluationConsent: vi.fn(),
}));
afterEach(() => vi.clearAllMocks());

function submitted(overrides: object = {}) {
  const dto = attemptDto({
    status: "SUBMITTED",
    currentQuestionPosition: null,
    currentPhase: null,
    phaseEndsAtUtc: null,
    ...overrides,
  });
  dto.questions[0].recording = {
    durationSeconds: 12,
    uploadedAtUtc: "2026-10-30T09:00:00Z",
  } as never;
  return parseAttempt(dto);
}

describe("SpeakingEvaluationPanel", () => {
  it("explains when the server has no AI evaluation configured", async () => {
    vi.mocked(getSpeakingEvaluationAvailability).mockResolvedValue(false);
    render(<SpeakingEvaluationPanel attempt={submitted()} uploading={false} />);

    expect(
      await screen.findByText(
        "Chấm AI cho Speaking chưa được bật trên máy chủ",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("asks for consent, queues the evaluation and shows its progress", async () => {
    vi.mocked(getSpeakingEvaluationAvailability).mockResolvedValue(true);
    vi.mocked(grantSpeakingEvaluationConsent).mockResolvedValue(
      submitted({ evaluation: evaluationDto({ status: "QUEUED", items: [] }) }),
    );
    render(<SpeakingEvaluationPanel attempt={submitted()} uploading={false} />);

    const button = await screen.findByRole("button", {
      name: "Đồng ý và chấm bài",
    });
    expect(button).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(button);

    expect(await screen.findByText("Đã xếp hàng chờ chấm")).toBeInTheDocument();
    expect(grantSpeakingEvaluationConsent).toHaveBeenCalledOnce();
  });

  it("shows the backend reason when the request is refused", async () => {
    vi.mocked(getSpeakingEvaluationAvailability).mockResolvedValue(true);
    vi.mocked(grantSpeakingEvaluationConsent).mockRejectedValue(
      new SpeakingApiError(409, "Bản ghi cuối vẫn đang được tải lên."),
    );
    render(<SpeakingEvaluationPanel attempt={submitted()} uploading={false} />);

    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Đồng ý và chấm bài" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Bản ghi cuối vẫn đang được tải lên.",
    );
  });

  it("renders the completed report per question", async () => {
    vi.mocked(getSpeakingEvaluationAvailability).mockResolvedValue(true);
    render(
      <SpeakingEvaluationPanel
        attempt={submitted({ evaluation: evaluationDto() })}
        uploading={false}
      />,
    );

    expect(screen.getByText("130")).toBeInTheDocument();
    expect(
      screen.getByText("Bạn trả lời đúng thông tin trong lịch."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("2/3 điểm")).toHaveLength(2);
    expect(screen.getByText("conference")).toBeInTheDocument();
    expect(
      screen.getByText("Không nhận diện được giọng nói trong bản ghi."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("It is held at the Grand Hotel.")).toHaveLength(
      2,
    );
    expect(getSpeakingAttempt).not.toHaveBeenCalled();
  });

  it("lets the learner retry a failed evaluation", async () => {
    vi.mocked(getSpeakingEvaluationAvailability).mockResolvedValue(true);
    vi.mocked(grantSpeakingEvaluationConsent).mockResolvedValue(
      submitted({ evaluation: evaluationDto({ status: "QUEUED", items: [] }) }),
    );
    render(
      <SpeakingEvaluationPanel
        attempt={submitted({
          evaluation: evaluationDto({
            status: "FAILED",
            items: [],
            failureMessage:
              "Dịch vụ nhận diện giọng nói chưa được cấu hình đúng.",
          }),
        })}
        uploading={false}
      />,
    );

    expect(
      screen.getByText("Dịch vụ nhận diện giọng nói chưa được cấu hình đúng."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Thử chấm lại" }));
    expect(await screen.findByText("Đã xếp hàng chờ chấm")).toBeInTheDocument();
  });
});
