import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { knowledgeRequest } from "@/features/knowledge/public-api";
import Page from "./page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("q=reading&pageNumber=2"),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/features/knowledge/public-api", () => ({
  knowledgeRequest: vi.fn(),
}));

it("restores filters and pagination from the URL without losing the query", async () => {
  vi.mocked(knowledgeRequest).mockImplementation(async (path) =>
    path === "categories"
      ? []
      : {
          items: [],
          pageNumber: 2,
          pageSize: 12,
          totalCount: 36,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: true,
        },
  );
  render(<Page />);
  expect(
    await screen.findByRole("link", { name: /next page/i }),
  ).toHaveAttribute("href", "/knowledge?q=reading&pageNumber=3");
  expect(screen.getByRole("textbox", { name: "Search articles" })).toHaveValue(
    "reading",
  );
  expect(knowledgeRequest).toHaveBeenCalledWith(
    "articles?q=reading&pageNumber=2",
    "GET",
    expect.any(AbortSignal),
  );
});
