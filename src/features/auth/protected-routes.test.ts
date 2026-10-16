import { describe, expect, it } from "vitest";
import { authUrl, isProtectedPath, safeReturnTo } from "./protected-routes";

const paths = ["/dashboard", "/practice"] as const;

describe("protected routes", () => {
  it("matches a protected path and its descendants on segment boundaries", () => {
    expect(isProtectedPath("/dashboard", paths)).toBe(true);
    expect(isProtectedPath("/dashboard/results", paths)).toBe(true);
    expect(isProtectedPath("/practices", paths)).toBe(false);
    expect(isProtectedPath("/", paths)).toBe(false);
    expect(isProtectedPath("/profile")).toBe(true);
    expect(isProtectedPath("/profile/security")).toBe(true);
  });

  it("keeps only same-origin destinations within protected paths", () => {
    expect(safeReturnTo("/dashboard?tab=progress", paths)).toBe(
      "/dashboard?tab=progress",
    );
    expect(safeReturnTo("https://example.com/dashboard", paths)).toBe("/");
    expect(safeReturnTo("//example.com/dashboard", paths)).toBe("/");
    expect(safeReturnTo("/\\example.com/dashboard", paths)).toBe("/");
    expect(safeReturnTo("/public", paths)).toBe("/");
    expect(safeReturnTo(["/dashboard"], paths)).toBe("/");
  });

  it("preserves an accepted destination between auth pages", () => {
    expect(authUrl("/login", "/dashboard?tab=progress")).toBe(
      "/login?next=%2Fdashboard%3Ftab%3Dprogress",
    );
    expect(authUrl("/register", "/")).toBe("/register");
    expect(safeReturnTo("/profile")).toBe("/profile");
  });
});
