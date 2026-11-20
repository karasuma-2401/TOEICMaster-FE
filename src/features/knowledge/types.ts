export type KnowledgeSkill =
  "General" | "Listening" | "Reading" | "Speaking" | "Writing";

export type KnowledgeArticleStatus = "Draft" | "Published" | "Archived";

export const KNOWLEDGE_SKILLS: { value: KnowledgeSkill; label: string }[] = [
  { value: "General", label: "Tổng hợp (General)" },
  { value: "Listening", label: "Listening" },
  { value: "Reading", label: "Reading" },
  { value: "Speaking", label: "Speaking" },
  { value: "Writing", label: "Writing" },
];

export const KNOWLEDGE_STATUSES: {
  value: KnowledgeArticleStatus;
  label: string;
}[] = [
  { value: "Draft", label: "Bản nháp" },
  { value: "Published", label: "Đã xuất bản" },
  { value: "Archived", label: "Lưu trữ" },
];

export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
}

export interface TiptapDoc {
  type: "doc";
  content?: TiptapNode[];
}

export interface KnowledgeTocItem {
  id: string;
  level: number;
  text: string;
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  articleCount: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  version: number;
}

export interface KnowledgeTag {
  id: string;
  name: string;
  slug: string;
}

export interface KnowledgeMediaAsset {
  id: string;
  originalFileName: string;
  contentType: string;
  byteLength: number;
  adminUrl: string;
  usageCount?: number;
  createdAtUtc: string;
}

export interface KnowledgeArticleSummary {
  id: string;
  title: string;
  slug: string;
  summary: string;
  skill: KnowledgeSkill;
  categoryId: string;
  categoryName: string;
  coverImageAssetId: string | null;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  estimatedReadMinutes: number;
  status: KnowledgeArticleStatus;
  publishedAtUtc: string | null;
  tags: KnowledgeTag[];
  createdAtUtc: string;
  updatedAtUtc: string;
  version: number;
}

export interface KnowledgeArticleDetail extends KnowledgeArticleSummary {
  content: TiptapDoc;
  toc: KnowledgeTocItem[];
}

export interface PageResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface KnowledgeCategoryInput {
  name: string;
  slug: string | null;
  description: string | null;
  displayOrder: number;
}

export interface KnowledgeArticleInput {
  title: string;
  slug: string | null;
  summary: string;
  skill: KnowledgeSkill;
  categoryId: string;
  coverImageAssetId: string | null;
  coverImageAlt: string | null;
  content: TiptapDoc;
  tags: string[];
}
