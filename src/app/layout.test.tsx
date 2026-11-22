import { Children, type ReactElement } from "react";
import { describe, expect, it } from "vitest";
import RootLayout from "./layout";

describe("RootLayout", () => {
  it("suppresses hydration warnings and renders the skip link as the first focusable body child", () => {
    const html = RootLayout({ children: null });
    const body = html.props.children as ReactElement<{
      suppressHydrationWarning?: boolean;
      children?: React.ReactNode;
    }>;

    expect(body.type).toBe("body");
    expect(body.props.suppressHydrationWarning).toBe(true);

    const children = Children.toArray(body.props.children);
    const skipLink = children[0] as ReactElement<{
      href?: string;
      className?: string;
      "data-testid"?: string;
      children?: string;
    }>;
    expect(skipLink.type).toBe("a");
    expect(skipLink.props.href).toBe("#main-content");
    expect(skipLink.props.className).toBe("tm-skip-link");
    expect(skipLink.props["data-testid"]).toBe("skip-to-main-link");
    expect(skipLink.props.children).toBe("Skip to main content");
  });
});
