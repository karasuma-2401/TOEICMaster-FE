import { KnowledgeArticleEditorPage } from "@/features/knowledge/components/knowledge-article-editor-page";

type Props = { params: Promise<{ articleId: string }> };

export default async function AdminKnowledgeEditPage({ params }: Props) {
  const { articleId } = await params;
  return <KnowledgeArticleEditorPage articleId={articleId} />;
}
