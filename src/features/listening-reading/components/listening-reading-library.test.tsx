// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LrExamCatalogItemApi } from "@/features/lr-exam/api";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/user/components/user-menu", () => ({
  UserMenu: () => <div data-testid="user-menu" />,
}));

vi.mock("@/features/lr-exam/api", () => ({
  getLrCatalog: vi.fn(),
}));

import { getLrCatalog } from "@/features/lr-exam/api";
import { ListeningReadingLibrary } from "./listening-reading-library";

const mockedGetLrCatalog = vi.mocked(getLrCatalog);

const sampleExam: LrExamCatalogItemApi = {
  examId: "exam-1",
  code: "ETS-2026-01",
  title: "ETS 2026 Test 01",
  versionNumber: 1,
  totalQuestions: 200,
  listeningQuestions: 100,
  readingQuestions: 100,
  publishedAtUtc: "2026-11-10T00:00:00Z",
};

describe("ListeningReadingLibrary", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("starts loading immediately on mount and renders catalog items on success", async () => {
    let resolveCatalog!: (items: LrExamCatalogItemApi[]) => void;
    mockedGetLrCatalog.mockImplementation(
      () =>
        new Promise<LrExamCatalogItemApi[]>((resolve) => {
          resolveCatalog = resolve;
        }),
    );

    render(<ListeningReadingLibrary skill="listening" />);

    expect(
      screen.getByText("Đang tải đề thi Listening & Reading…"),
    ).toBeInTheDocument();
    expect(mockedGetLrCatalog).toHaveBeenCalledTimes(1);
    expect(mockedGetLrCatalog.mock.calls[0]?.[0]).toBeInstanceOf(AbortSignal);

    resolveCatalog([sampleExam]);

    expect(await screen.findByText("ETS 2026 Test 01")).toBeInTheDocument();
    expect(
      screen.queryByText("Đang tải đề thi Listening & Reading…"),
    ).not.toBeInTheDocument();
  });

  it("renders error state on failure and recovers when retried", async () => {
    let resolveRetry!: (items: LrExamCatalogItemApi[]) => void;
    mockedGetLrCatalog
      .mockRejectedValueOnce(new Error("Không thể kết nối máy chủ."))
      .mockImplementationOnce(
        () =>
          new Promise<LrExamCatalogItemApi[]>((resolve) => {
            resolveRetry = resolve;
          }),
      );

    render(<ListeningReadingLibrary skill="reading" />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Không thể kết nối máy chủ.");

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.getByText("Đang tải đề thi Listening & Reading…"),
    ).toBeInTheDocument();
    expect(mockedGetLrCatalog).toHaveBeenCalledTimes(2);

    resolveRetry([sampleExam]);

    expect(await screen.findByText("ETS 2026 Test 01")).toBeInTheDocument();
  });

  it("aborts the in-flight catalog request on unmount", async () => {
    let resolveCatalog!: (items: LrExamCatalogItemApi[]) => void;
    mockedGetLrCatalog.mockImplementation(
      () =>
        new Promise<LrExamCatalogItemApi[]>((resolve) => {
          resolveCatalog = resolve;
        }),
    );

    const { unmount } = render(<ListeningReadingLibrary skill="listening" />);
    const signal = mockedGetLrCatalog.mock.calls[0]?.[0];
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal?.aborted).toBe(false);

    unmount();

    expect(signal?.aborted).toBe(true);
    resolveCatalog([sampleExam]);
    await waitFor(() => {
      expect(mockedGetLrCatalog).toHaveBeenCalledTimes(1);
    });
  });
});
