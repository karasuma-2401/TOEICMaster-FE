import { Suspense } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { getSession } from "@/features/auth/api";
import { knowledgeRequest } from "@/features/knowledge/public-api";
import { KnowledgeApiError } from "@/features/knowledge/http";
import Page from "./page";

vi.mock("@/features/auth/api", () => ({
  getSession: vi.fn(),
  refreshSession: vi.fn(),
}));
vi.mock("@/features/knowledge/public-api", () => ({
  knowledgeRequest: vi.fn(),
}));
vi.mock("@/features/knowledge/components/knowledge-article-preview", () => ({
  KnowledgeArticlePreview: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSession).mockResolvedValue({ status: "guest" });
});

it("lets guests read without requesting saved lessons or refreshing a session", async () => {
  vi.mocked(knowledgeRequest).mockImplementation(async (path) =>
    path.endsWith("/related")
      ? []
      : {
          id: "article-1",
          title: "Reading guide",
          categoryName: "Tips",
          tags: [],
        },
  );
  await act(async () => {
    render(
      <Suspense>
        <Page params={Promise.resolve({ slug: "reading" })} />
      </Suspense>,
    );
  });
  await screen.findByRole("heading", { name: "Reading guide" });
  await waitFor(() => expect(getSession).toHaveBeenCalled());
  expect(
    vi
      .mocked(knowledgeRequest)
      .mock.calls.some(([path]) => path.startsWith("saved")),
  ).toBe(false);
});

it("renders a useful 404 with a link to the library", async () => {
  vi.mocked(knowledgeRequest).mockRejectedValue(
    new KnowledgeApiError(404, "Not Found"),
  );
  await act(async () => {
    render(
      <Suspense>
        <Page params={Promise.resolve({ slug: "missing" })} />
      </Suspense>,
    );
  });
  expect(
    await screen.findByRole("heading", { name: /article not found/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /knowledge library/i }),
  ).toHaveAttribute("href", "/knowledge");
});

it("checks the current article directly even when its bookmark is outside the first page", async () => {
  vi.mocked(getSession).mockResolvedValue({
    status: "authenticated",
    user: { id: "user", displayName: "User", email: "user@example.com" },
  });
  vi.mocked(knowledgeRequest).mockImplementation(async (path) =>
    path.startsWith("saved?")
      ? {
          items: [
            {
              articleId: "article-99",
              title: "Reading guide",
              url: "/knowledge/reading",
              available: true,
            },
          ],
        }
      : path.endsWith("/related")
        ? []
        : {
            id: "article-99",
            title: "Reading guide",
            categoryName: "Tips",
            tags: [],
          },
  );
  await act(async () => {
    render(
      <Suspense>
        <Page params={Promise.resolve({ slug: "reading" })} />
      </Suspense>,
    );
  });
  expect(await screen.findByRole("button", { name: /saved/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(knowledgeRequest).toHaveBeenCalledWith(
    "saved?articleId=article-99&pageNumber=1&pageSize=1",
    "GET",
    expect.any(AbortSignal),
  );
});
