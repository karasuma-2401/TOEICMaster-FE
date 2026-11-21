import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import RootLayout from "./layout";

describe("RootLayout", () => {
  it("suppresses hydration warnings when an extension mutates the body", () => {
    const html = RootLayout({ children: null });
    const body = html.props.children as ReactElement<{
      suppressHydrationWarning?: boolean;
    }>;

    expect(body.type).toBe("body");
    expect(body.props.suppressHydrationWarning).toBe(true);
  });
});
