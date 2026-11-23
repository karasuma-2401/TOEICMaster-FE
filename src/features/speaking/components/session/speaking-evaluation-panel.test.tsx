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
        "AI grading for Speaking is not enabled on the server",
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
      name: "Agree & Start AI Grading →",
    });
    expect(button).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(button);

    expect(await screen.findByText("Queued for grading")).toBeInTheDocument();
    expect(grantSpeakingEvaluationConsent).toHaveBeenCalledOnce();
  });

  it("shows the backend reason when the request is refused", async () => {
    vi.mocked(getSpeakingEvaluationAvailability).mockResolvedValue(true);
    vi.mocked(grantSpeakingEvaluationConsent).mockRejectedValue(
      new SpeakingApiError(409, "The final recording is still uploading."),
    );
    render(<SpeakingEvaluationPanel attempt={submitted()} uploading={false} />);

    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: "Agree & Start AI Grading →" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The final recording is still uploading.",
    );
  });

  it("offers login when a guest has used the daily evaluation", async () => {
    vi.mocked(getSpeakingEvaluationAvailability).mockResolvedValue(true);
    vi.mocked(grantSpeakingEvaluationConsent).mockRejectedValue(
      new SpeakingApiError(
        409,
        "Anonymous session has already used the AI evaluation in the past 24 hours. Please log in or try again later.",
      ),
    );
    render(<SpeakingEvaluationPanel attempt={submitted()} uploading={false} />);

    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: "Agree & Start AI Grading →" }),
    );

    expect(
      await screen.findByRole("link", {
        name: "Log in for more evaluations →",
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
    const evaluation = evaluationDto({
      summary: "You answered with the correct schedule details.",
    });
    render(
      <SpeakingEvaluationPanel
        attempt={submitted({ evaluation })}
        uploading={false}
      />,
    );

    expect(screen.getByText("130 / 200")).toBeInTheDocument();
    expect(
      screen.getByText("You answered with the correct schedule details."),
    ).toBeInTheDocument();
    expect(screen.getByText("Pronunciation")).toBeInTheDocument();
    expect(screen.getByText("79/100")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to attempt history" }),
    ).toHaveAttribute("href", "/history");
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
              "The speech recognition service is not configured properly.",
          }),
        })}
        uploading={false}
      />,
    );

    expect(
      screen.getByText(
        "The speech recognition service is not configured properly.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry grading" }));
    expect(await screen.findByText("Queued for grading")).toBeInTheDocument();
  });
});
