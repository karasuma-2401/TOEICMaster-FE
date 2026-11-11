// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSpeakingAttempt,
  getSpeakingAttempts,
  getSpeakingEvaluationAvailability,
  grantSpeakingEvaluationConsent,
} from "@/features/speaking/api";
import { parseAttempt } from "@/features/speaking/attempt";
import { SpeakingApiError } from "@/features/speaking/http";
import {
  attemptDto,
  evaluationDto,
  ids,
} from "@/features/speaking/testing/fixtures";
import { SpeakingEvaluationPanel } from "./speaking-evaluation-panel";

vi.mock("../speaking-header", () => ({
  SpeakingHeader: () => <header>Speaking header</header>,
}));
vi.mock("@/features/speaking/api", () => ({
  getSpeakingAttempt: vi.fn(),
  getSpeakingAttempts: vi.fn().mockResolvedValue([]),
  getSpeakingEvaluationAvailability: vi.fn(),
  grantSpeakingEvaluationConsent: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

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
      name: "Đồng ý & Bắt đầu chấm AI →",
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
    fireEvent.click(
      screen.getByRole("button", { name: "Đồng ý & Bắt đầu chấm AI →" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Bản ghi cuối vẫn đang được tải lên.",
    );
  });

  it("offers login when a guest has used the daily evaluation", async () => {
    vi.mocked(getSpeakingEvaluationAvailability).mockResolvedValue(true);
    vi.mocked(grantSpeakingEvaluationConsent).mockRejectedValue(
      new SpeakingApiError(
        409,
        "Phiên ẩn danh đã dùng lượt chấm AI trong 24 giờ qua. Hãy đăng nhập hoặc thử lại sau.",
      ),
    );
    render(<SpeakingEvaluationPanel attempt={submitted()} uploading={false} />);

    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: "Đồng ý & Bắt đầu chấm AI →" }),
    );

    expect(
      await screen.findByRole("link", {
        name: "Đăng nhập để nhận thêm lượt →",
      }),
    ).toHaveAttribute(
      "href",
      `/login?next=${encodeURIComponent(`/speaking/tests/${ids.test}`)}`,
    );
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("renders the completed report with criteria averages", async () => {
    vi.mocked(getSpeakingEvaluationAvailability).mockResolvedValue(true);
    vi.mocked(getSpeakingAttempts).mockResolvedValue([]);
    render(
      <SpeakingEvaluationPanel
        attempt={submitted({ evaluation: evaluationDto() })}
        uploading={false}
      />,
    );

    expect(screen.getByText("130 / 200")).toBeInTheDocument();
    expect(
      screen.getByText("Bạn trả lời đúng thông tin trong lịch."),
    ).toBeInTheDocument();
    expect(screen.getByText("Phát âm")).toBeInTheDocument();
    expect(screen.getByText("79/100")).toBeInTheDocument();
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
