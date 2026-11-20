// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KnowledgeArticlePreview } from "./knowledge-article-preview";

describe("KnowledgeArticlePreview", () => {
  it("renders safe links as anchors and strips unsafe link hrefs to plain text", () => {
    render(
      <KnowledgeArticlePreview
        categoryName="Ngữ pháp"
        content={{
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Safe HTTPS",
                  marks: [
                    {
                      type: "link",
                      attrs: { href: "https://example.com/docs" },
                    },
                  ],
                },
                {
                  type: "text",
                  text: "Unsafe JS",
                  marks: [
                    {
                      type: "link",
                      attrs: { href: "  JaVaScRiPt:alert(1)" },
                    },
                  ],
                },
                {
                  type: "text",
                  text: "Unsafe Protocol-Relative",
                  marks: [
                    {
                      type: "link",
                      attrs: { href: "//evil.com/steal" },
                    },
                  ],
                },
              ],
            },
          ],
        }}
        coverImageAlt={null}
        coverImageAssetId={null}
        skill="Reading"
        status="Draft"
        summary="Tóm tắt"
        tags={[]}
        title="Kiểm tra liên kết"
      />,
    );

    const safeAnchor = screen.getByRole("link", { name: "Safe HTTPS" });
    expect(safeAnchor).toHaveAttribute("href", "https://example.com/docs");

    expect(screen.getByText("Unsafe JS")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Unsafe JS" }),
    ).not.toBeInTheDocument();

    expect(screen.getByText("Unsafe Protocol-Relative")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Unsafe Protocol-Relative" }),
    ).not.toBeInTheDocument();
  });

  it("skips rendering images with unsafe fallback src and keeps safe images", () => {
    const { container } = render(
      <KnowledgeArticlePreview
        categoryName="Ngữ pháp"
        content={{
          type: "doc",
          content: [
            {
              type: "image",
              attrs: {
                src: "DATA:text/html,<script>alert(1)</script>",
                alt: "Unsafe image",
              },
            },
            {
              type: "image",
              attrs: {
                src: "https://cdn.example.com/safe.png",
                alt: "Safe image",
              },
            },
          ],
        }}
        coverImageAlt={null}
        coverImageAssetId={null}
        skill="Reading"
        status="Draft"
        summary="Tóm tắt"
        tags={[]}
        title="Kiểm tra hình ảnh"
      />,
    );

    expect(screen.queryByAltText("Unsafe image")).not.toBeInTheDocument();
    const safeImg = screen.getByAltText("Safe image");
    expect(safeImg).toHaveAttribute("src", "https://cdn.example.com/safe.png");
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });
});
