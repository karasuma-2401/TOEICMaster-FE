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
    { signal, fallback: "Không thể tải danh sách danh mục kiến thức." },
  );
}

export function createKnowledgeCategory(input: KnowledgeCategoryInput) {
  return knowledgeAdminRequest<KnowledgeCategory>(`${BASE}/categories`, {
    method: "POST",
    json: input,
    fallback: "Không thể tạo danh mục kiến thức.",
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
      fallback: "Không thể cập nhật danh mục kiến thức.",
    },
  );
}

export function deleteKnowledgeCategory(categoryId: string, version: number) {
  return knowledgeAdminRequest<void>(
    `${BASE}/categories/${categoryId}${buildQuery({ version })}`,
    {
      method: "DELETE",
      fallback: "Không thể xóa danh mục kiến thức.",
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
    { signal, fallback: "Không thể tải danh sách thẻ." },
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
    { signal, fallback: "Không thể tải thư viện hình ảnh." },
  );
}

export function uploadKnowledgeImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  return knowledgeAdminRequest<KnowledgeMediaAsset>(`${BASE}/media/images`, {
    method: "POST",
    form,
    fallback: "Không thể tải lên hình ảnh.",
  });
}

export function deleteKnowledgeMedia(assetId: string) {
  return knowledgeAdminRequest<void>(`${BASE}/media/${assetId}`, {
    method: "DELETE",
    fallback: "Không thể xóa hình ảnh.",
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
  return knowledgeAdminRequest<PageResult<KnowledgeArticleSummary>>(
    `${BASE}/articles${buildQuery(params)}`,
    { signal, fallback: "Không thể tải danh sách bài viết kiến thức." },
  );
}

export function getKnowledgeArticle(articleId: string, signal?: AbortSignal) {
  return knowledgeAdminRequest<KnowledgeArticleDetail>(
    `${BASE}/articles/${articleId}`,
    { signal, fallback: "Không thể tải chi tiết bài viết." },
  );
}

export function createKnowledgeArticle(input: KnowledgeArticleInput) {
  return knowledgeAdminRequest<KnowledgeArticleDetail>(`${BASE}/articles`, {
    method: "POST",
    json: input,
    fallback: "Không thể tạo bài viết kiến thức.",
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
      fallback: "Không thể cập nhật bài viết kiến thức.",
    },
  );
}

export function publishKnowledgeArticle(articleId: string, version: number) {
  return knowledgeAdminRequest<KnowledgeArticleDetail>(
    `${BASE}/articles/${articleId}/publish`,
    {
      method: "POST",
      json: { version },
      fallback: "Không thể xuất bản bài viết.",
    },
  );
}

export function unpublishKnowledgeArticle(articleId: string, version: number) {
  return knowledgeAdminRequest<KnowledgeArticleDetail>(
    `${BASE}/articles/${articleId}/unpublish`,
    {
      method: "POST",
      json: { version },
      fallback: "Không thể gỡ bài viết về bản nháp.",
    },
  );
}

export function archiveKnowledgeArticle(articleId: string, version: number) {
  return knowledgeAdminRequest<KnowledgeArticleDetail>(
    `${BASE}/articles/${articleId}/archive`,
    {
      method: "POST",
      json: { version },
      fallback: "Không thể lưu trữ bài viết.",
    },
  );
}

export function deleteKnowledgeArticle(articleId: string, version: number) {
  return knowledgeAdminRequest<void>(
    `${BASE}/articles/${articleId}${buildQuery({ version })}`,
    {
      method: "DELETE",
      fallback: "Không thể xóa bài viết.",
    },
  );
}
