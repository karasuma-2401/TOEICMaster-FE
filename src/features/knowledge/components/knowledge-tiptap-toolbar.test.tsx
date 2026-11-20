// @vitest-environment jsdom
import { Editor } from "@tiptap/react";
import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { TiptapDoc } from "../types";
import { KnowledgeArticlePreview } from "./knowledge-article-preview";
import { KnowledgeTiptapToolbar } from "./knowledge-tiptap-toolbar";

let editor: Editor | undefined;

afterEach(() => {
  cleanup();
  editor?.destroy();
  editor = undefined;
});

function createEditor() {
  editor = new Editor({
    extensions: [
      StarterKit.configure({ link: false }),
      Link.configure({ openOnClick: false }),
    ],
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Read this" }],
        },
      ],
    },
  });
  editor.commands.setTextSelection({ from: 1, to: 10 });
  return editor;
}

function toolbar(instance: Editor) {
  return (
    <KnowledgeTiptapToolbar
      editor={instance}
      onDirectImageUpload={() => {}}
      onOpenMediaPicker={() => {}}
      uploading={false}
    />
  );
}

describe("KnowledgeTiptapToolbar links", () => {
  it.each([
    ["protocol-relative URL", "//host/path"],
    ["backslash-prefixed URL", "/\\host/path"],
    ["control-character protocol obfuscation", "java\tscript:alert(1)"],
    ["control-character protocol-relative URL", "\u0001//host/path"],
  ])("rejects a %s through the link toolbar", async (_label, href) => {
    const user = userEvent.setup();
    const instance = createEditor();
    render(toolbar(instance));

    await user.click(
      screen.getByRole("button", { name: "Gắn hoặc sửa liên kết" }),
    );
    const input = screen.getByPlaceholderText(
      "Nhập URL (https://..., mailto:..., hoặc /...)",
    );
    fireEvent.change(input, { target: { value: href } });
    await user.click(screen.getByRole("button", { name: "Áp dụng" }));

    expect(instance.isActive("link")).toBe(false);
    expect(input).toBeInTheDocument();
  });

  it("uses the sanitized destination in the editor and preview", async () => {
    const user = userEvent.setup();
    const instance = createEditor();
    const { rerender } = render(toolbar(instance));

    await user.click(
      screen.getByRole("button", { name: "Gắn hoặc sửa liên kết" }),
    );
    const input = screen.getByPlaceholderText(
      "Nhập URL (https://..., mailto:..., hoặc /...)",
    );
    fireEvent.change(input, {
      target: { value: "  https://example.com/articles?tab=toeic  " },
    });
    await user.click(screen.getByRole("button", { name: "Áp dụng" }));

    const href = "https://example.com/articles?tab=toeic";
    await waitFor(() => expect(instance.isActive("link")).toBe(true));
    const document = instance.getJSON() as TiptapDoc;
    const text = document.content?.[0].content?.[0];
    expect(text?.marks?.find((mark) => mark.type === "link")?.attrs?.href).toBe(
      href,
    );

    rerender(
      <>
        {toolbar(instance)}
        <KnowledgeArticlePreview
          categoryName="Reading"
          content={document}
          coverImageAlt={null}
          coverImageAssetId={null}
          skill="Reading"
          status="Draft"
          summary="Summary"
          tags={[]}
          title="Article"
        />
      </>,
    );

    expect(screen.getByRole("link", { name: "Read this" })).toHaveAttribute(
      "href",
      href,
    );
  });
});
