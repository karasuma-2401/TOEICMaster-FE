// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WritingTestWorkspace } from "./writing-test-workspace";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/admin/exam-api", () => ({
  getWritingTest: vi.fn(),
  getPublishedWritingExercises: vi.fn(),
  updateWritingTest: vi.fn(),
  publishWritingTest: vi.fn(),
}));

import {
  getPublishedWritingExercises,
  getWritingTest,
} from "@/features/admin/exam-api";

const id = "5db1ff4b-7c02-4073-8d68-4c8405b6d44f";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getWritingTest).mockResolvedValue({
    id,
    code: "WR-2026-001",
    title: "Writing placement",
    description: "October test",
    status: "DRAFT",
    version: 1,
    createdAtUtc: "2026-10-28T00:00:00Z",
    updatedAtUtc: "2026-10-28T00:00:00Z",
    publishedAtUtc: null,
    questions: [],
  });
  vi.mocked(getPublishedWritingExercises).mockImplementation(async (part) => ({
    items: [
      {
        id,
        part,
        code: `WR${part}-001`,
        topic: "Office",
        difficulty: "MEDIUM",
        status: "PUBLISHED",
        rubricNotes: "",
        modelAnswer: "",
        imageAssetId: null,
        imageAlt: null,
        keywordOne: null,
        keywordTwo: null,
        sender: null,
        recipient: null,
        subject: null,
        emailBody: null,
        directions: null,
        prompt: null,
        minimumWordCount: null,
        outline: null,
        version: 1,
        createdAtUtc: "2026-10-28T00:00:00Z",
        updatedAtUtc: "2026-10-28T00:00:00Z",
      },
    ],
    pageNumber: 1,
    pageSize: 50,
    totalCount: 1,
    totalPages: 1,
  }));
});

describe("WritingTestWorkspace", () => {
  it("renders the 5-2-1 published-exercise slots required by the backend", async () => {
    render(<WritingTestWorkspace testId={id} />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "WR-2026-001" }),
      ).toBeInTheDocument(),
    );

    expect(screen.getByText("Part 1 · 5 bài")).toBeInTheDocument();
    expect(screen.getByText("Part 2 · 2 bài")).toBeInTheDocument();
    expect(screen.getByText("Part 3 · 1 bài")).toBeInTheDocument();
    expect(
      screen.getAllByRole("combobox", { name: /Bài tập Part/i }),
    ).toHaveLength(8);
  });
});
