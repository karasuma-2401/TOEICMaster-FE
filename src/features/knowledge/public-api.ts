import { knowledgeAdminRequest } from "./http";

export interface SavedArticle {
  articleId: string;
  title: string;
  url: string | null;
  available: boolean;
}

export function knowledgeRequest<T>(
  path: string,
  method: "GET" | "PUT" | "DELETE" = "GET",
  signal?: AbortSignal,
) {
  return knowledgeAdminRequest<T>(`/api/knowledge/${path}`, {
    method,
    signal,
    fallback: "Could not load lessons. Please try again.",
  });
}
