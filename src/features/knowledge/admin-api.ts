import { knowledgeAdminRequest } from "./http";
import type {
  KnowledgeArticleDetail,
  KnowledgeArticleInput,
  KnowledgeArticleSummary,
  KnowledgeCategory,
  KnowledgeCategoryInput,
  KnowledgeMediaAsset,
  KnowledgeTag,
  PageResult,
} from "./types";

const BASE = "/api/admin/knowledge";

function buildQuery(
  params: Record<string, string | number | boolean | undefined | null>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
}

export function toAdminBffMediaUrl(assetId: string) {
  return `${BASE}/media/${assetId}`;
}

export function listKnowledgeCategories(
  params: {
    query?: string;
    hasArticles?: boolean;
    sort?: string;
    pageNumber?: number;
    pageSize?: number;
  } = {},
  signal?: AbortSignal,
) {
  return knowledgeAdminRequest<PageResult<KnowledgeCategory>>(
    `${BASE}/categories${buildQuery(params)}`,
    { signal, fallback: "Could not load knowledge categories." },
  );
}

export function createKnowledgeCategory(input: KnowledgeCategoryInput) {
  return knowledgeAdminRequest<KnowledgeCategory>(`${BASE}/categories`, {
    method: "POST",
    json: input,
    fallback: "Could not create knowledge category.",
  });
}

export function updateKnowledgeCategory(
  categoryId: string,
  version: number,
  category: KnowledgeCategoryInput,
) {
  return knowledgeAdminRequest<KnowledgeCategory>(
    `${BASE}/categories/${categoryId}`,
    {
      method: "PUT",
      json: { version, category },
      fallback: "Could not update knowledge category.",
    },
  );
}

export function deleteKnowledgeCategory(categoryId: string, version: number) {
  return knowledgeAdminRequest<void>(
    `${BASE}/categories/${categoryId}${buildQuery({ version })}`,
    {
      method: "DELETE",
      fallback: "Could not delete knowledge category.",
    },
  );
}

export function listKnowledgeTags(
  params: {
    query?: string;
    sort?: string;
    pageNumber?: number;
    pageSize?: number;
  } = {},
  signal?: AbortSignal,
) {
  return knowledgeAdminRequest<PageResult<KnowledgeTag>>(
    `${BASE}/tags${buildQuery(params)}`,
    { signal, fallback: "Could not load tags." },
  );
}

export function listKnowledgeMedia(
  params: {
    query?: string;
    unusedOnly?: boolean;
    sort?: string;
    pageNumber?: number;
    pageSize?: number;
  } = {},
  signal?: AbortSignal,
) {
  return knowledgeAdminRequest<PageResult<KnowledgeMediaAsset>>(
    `${BASE}/media${buildQuery(params)}`,
    { signal, fallback: "Could not load media library." },
  );
}

export function uploadKnowledgeImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  return knowledgeAdminRequest<KnowledgeMediaAsset>(`${BASE}/media/images`, {
    method: "POST",
    form,
    fallback: "Could not upload image.",
  });
}

export function deleteKnowledgeMedia(assetId: string) {
  return knowledgeAdminRequest<void>(`${BASE}/media/${assetId}`, {
    method: "DELETE",
    fallback: "Could not delete image.",
  });
}

export function listKnowledgeArticles(
  params: {
    query?: string;
    skill?: string;
    categoryId?: string;
    tag?: string;
    status?: string;
    sort?: string;
    pageNumber?: number;
    pageSize?: number;
  } = {},
  signal?: AbortSignal,
) {
  const { query, ...rest } = params;
  return knowledgeAdminRequest<PageResult<KnowledgeArticleSummary>>(
    `${BASE}/articles${buildQuery({ ...rest, q: query })}`,
    { signal, fallback: "Could not load knowledge articles." },
  );
}

export function getKnowledgeArticle(articleId: string, signal?: AbortSignal) {
  return knowledgeAdminRequest<KnowledgeArticleDetail>(
    `${BASE}/articles/${articleId}`,
    { signal, fallback: "Could not load article details." },
  );
}

export function createKnowledgeArticle(input: KnowledgeArticleInput) {
  return knowledgeAdminRequest<KnowledgeArticleDetail>(`${BASE}/articles`, {
    method: "POST",
    json: input,
    fallback: "Could not create knowledge article.",
  });
}

export function updateKnowledgeArticle(
  articleId: string,
  version: number,
  article: KnowledgeArticleInput,
) {
  return knowledgeAdminRequest<KnowledgeArticleDetail>(
    `${BASE}/articles/${articleId}`,
    {
      method: "PUT",
      json: { version, article },
      fallback: "Could not update knowledge article.",
    },
  );
}

export function publishKnowledgeArticle(articleId: string, version: number) {
  return knowledgeAdminRequest<KnowledgeArticleDetail>(
    `${BASE}/articles/${articleId}/publish`,
    {
      method: "POST",
      json: { version },
      fallback: "Could not publish article.",
    },
  );
}

export function unpublishKnowledgeArticle(articleId: string, version: number) {
  return knowledgeAdminRequest<KnowledgeArticleDetail>(
    `${BASE}/articles/${articleId}/unpublish`,
    {
      method: "POST",
      json: { version },
      fallback: "Could not unpublish article to draft.",
    },
  );
}

export function archiveKnowledgeArticle(articleId: string, version: number) {
  return knowledgeAdminRequest<KnowledgeArticleDetail>(
    `${BASE}/articles/${articleId}/archive`,
    {
      method: "POST",
      json: { version },
      fallback: "Could not archive article.",
    },
  );
}

export function deleteKnowledgeArticle(articleId: string, version: number) {
  return knowledgeAdminRequest<void>(
    `${BASE}/articles/${articleId}${buildQuery({ version })}`,
    {
      method: "DELETE",
      fallback: "Could not delete article.",
    },
  );
}
