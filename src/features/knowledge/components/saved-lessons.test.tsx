import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { knowledgeRequest } from "../public-api";
import { SavedLessons } from "./saved-lessons";

vi.mock("../public-api", () => ({ knowledgeRequest: vi.fn() }));

it("pages saved lessons and never links unavailable entries with a null URL", async () => {
  vi.mocked(knowledgeRequest).mockImplementation(async (path) => ({
    items: path.includes("pageNumber=2")
      ? [
          {
            articleId: "private",
            title: "Lesson is no longer available",
            url: null,
            available: false,
          },
        ]
      : [
          {
            articleId: "public",
            title: "Reading guide",
            url: "/knowledge/reading",
            available: true,
          },
        ],
    pageNumber: path.includes("pageNumber=2") ? 2 : 1,
    pageSize: 12,
    totalCount: 13,
    totalPages: 2,
    hasNextPage: !path.includes("pageNumber=2"),
    hasPreviousPage: path.includes("pageNumber=2"),
  }));
  render(<SavedLessons />);
  expect(
    await screen.findByRole("link", { name: "Reading guide" }),
  ).toHaveAttribute("href", "/knowledge/reading");
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  await screen.findByText("Lesson is no longer available");
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
});

it("reports load errors instead of claiming the user has no saved lessons", async () => {
  vi.mocked(knowledgeRequest).mockRejectedValue(
    new Error("Service unavailable"),
  );
  render(<SavedLessons />);
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("Service unavailable"),
  );
  expect(screen.queryByText(/no saved lessons yet/i)).not.toBeInTheDocument();
});
