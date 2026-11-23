// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KnowledgeArticlePreview } from "./knowledge-article-preview";

describe("KnowledgeArticlePreview", () => {
  it("renders safe links as anchors and strips unsafe link hrefs to plain text", () => {
    render(
      <KnowledgeArticlePreview
        categoryName="Grammar"
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
                  text: "Control-Padded HTTPS",
                  marks: [
                    {
                      type: "link",
                      attrs: {
                        href: "\u0001  https://example.com/\u0007clean\u007f  ",
                      },
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
                  text: "Unsafe Data",
                  marks: [
                    {
                      type: "link",
                      attrs: {
                        href: "data:text/html,<script>alert(1)</script>",
                      },
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
        summary="Summary"
        tags={[]}
        title="Link verification"
      />,
    );

    const safeAnchor = screen.getByRole("link", { name: "Safe HTTPS" });
    expect(safeAnchor).toHaveAttribute("href", "https://example.com/docs");

    const cleanedAnchor = screen.getByRole("link", {
      name: "Control-Padded HTTPS",
    });
    expect(cleanedAnchor).toHaveAttribute("href", "https://example.com/clean");

    expect(screen.getByText("Unsafe JS")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Unsafe JS" }),
    ).not.toBeInTheDocument();

    expect(screen.getByText("Unsafe Data")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Unsafe Data" }),
    ).not.toBeInTheDocument();

    expect(screen.getByText("Unsafe Protocol-Relative")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Unsafe Protocol-Relative" }),
    ).not.toBeInTheDocument();
  });

  it("ignores malformed non-UUID assetId values and validates coverImageAssetId", () => {
    const validUuid = "11111111-2222-3333-4444-555555555555";
    const { container } = render(
      <KnowledgeArticlePreview
        categoryName="Grammar"
        content={{
          type: "doc",
          content: [
            {
              type: "image",
              attrs: {
                assetId: "../etc/passwd",
                src: "",
                alt: "Traversal assetId",
              },
            },
            {
              type: "image",
              attrs: {
                assetId: "not-a-uuid",
                src: "https://cdn.example.com/fallback.png",
                alt: "Fallback image",
              },
            },
            {
              type: "image",
              attrs: {
                assetId: validUuid,
                src: "",
                alt: "Valid UUID image",
              },
            },
          ],
        }}
        coverImageAlt="Malformed cover"
        coverImageAssetId="../secret"
        skill="Reading"
        status="Draft"
        summary="Summary"
        tags={[]}
        title="Asset ID verification"
      />,
    );

    expect(screen.queryByAltText("Traversal assetId")).not.toBeInTheDocument();
    expect(screen.queryByAltText("Malformed cover")).not.toBeInTheDocument();

    const fallbackImg = screen.getByAltText("Fallback image");
    expect(fallbackImg).toHaveAttribute(
      "src",
      "https://cdn.example.com/fallback.png",
    );

    const validImg = screen.getByAltText("Valid UUID image");
    expect(validImg).toHaveAttribute(
      "src",
      `/api/admin/knowledge/media/${validUuid}`,
    );
    expect(container.querySelectorAll("img")).toHaveLength(2);
  });

  it("skips rendering images with unsafe fallback src and keeps safe images", () => {
    const { container } = render(
      <KnowledgeArticlePreview
        categoryName="Grammar"
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
        summary="Summary"
        tags={[]}
        title="Image verification"
      />,
    );

    expect(screen.queryByAltText("Unsafe image")).not.toBeInTheDocument();
    const safeImg = screen.getByAltText("Safe image");
    expect(safeImg).toHaveAttribute("src", "https://cdn.example.com/safe.png");
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });
});
