// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSpeakingExercise,
  getSpeakingAdminSummary,
  listSpeakingExercises,
} from "@/features/speaking/admin-api";
import { parseExercise } from "@/features/speaking/parsers";
import {
  exerciseDto,
  pageDto,
  summaryDto,
} from "@/features/speaking/testing/fixtures";
import { AdminSpeakingContentPage } from "./admin-speaking-content-page";

vi.mock("@/features/speaking/admin-api", () => ({
  archiveSpeakingExercise: vi.fn(),
  createSpeakingExercise: vi.fn(),
  getSpeakingAdminSummary: vi.fn(),
  listSpeakingExercises: vi.fn(),
  updateSpeakingExercise: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(getSpeakingAdminSummary).mockResolvedValue(summaryDto);
  vi.mocked(listSpeakingExercises).mockImplementation(async (query) =>
    pageDto([parseExercise(exerciseDto(query.part ?? 1))]),
  );
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AdminSpeakingContentPage", () => {
  it("loads exercises per Part with server-side filters", async () => {
    render(<AdminSpeakingContentPage />);

    expect(await screen.findByText("SP1-001")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Part 4/ }));

    expect(await screen.findByText("SP4-001")).toBeInTheDocument();
    expect(listSpeakingExercises).toHaveBeenLastCalledWith(
      expect.objectContaining({ part: 4, pageNumber: 1, pageSize: 10 }),
      expect.any(AbortSignal),
    );
  });

  it("locks a dedicated workspace to its route Part", async () => {
    render(<AdminSpeakingContentPage part={3} />);

    expect(await screen.findByText("SP3-001")).toBeInTheDocument();
    expect(listSpeakingExercises).toHaveBeenLastCalledWith(
      expect.objectContaining({ part: 3, pageNumber: 1, pageSize: 10 }),
      expect.any(AbortSignal),
    );
    expect(
      screen.queryByRole("button", { name: /Part 1/i }),
    ).not.toBeInTheDocument();
  });

  it("shows a retryable error when the backend is unavailable", async () => {
    vi.mocked(listSpeakingExercises).mockRejectedValueOnce(
      new Error("Unable to connect to the service."),
    );
    render(<AdminSpeakingContentPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to connect to the service.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("SP1-001")).toBeInTheDocument();
  });

  it("validates Part-specific fields before calling the API", async () => {
    render(<AdminSpeakingContentPage />);
    await screen.findByText("SP1-001");

    fireEvent.click(screen.getByRole("button", { name: /Part 5/ }));
    fireEvent.click(screen.getByRole("button", { name: "+ Add exercise" }));
    fireEvent.click(screen.getByRole("button", { name: "Save exercise" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Exercise code and topic are required.",
      ),
    );
    expect(createSpeakingExercise).not.toHaveBeenCalled();
  });
});
