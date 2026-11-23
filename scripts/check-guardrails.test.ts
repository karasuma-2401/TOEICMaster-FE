import { describe, expect, it } from "vitest";
import {
  formatGuardrailViolation,
  runGuardrails,
} from "./check-guardrails.mjs";

describe("scripts/check-guardrails", () => {
  it("rejects the past strict exam-management GUID regex and names the shared guards", () => {
    const result = runGuardrails({
      files: {
        "src/features/admin/exam-management.ts": `
          function isGuid(value: unknown): value is string {
            return typeof value === "string" &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
          }
        `,
      },
    });
    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      {
        rule: "no-duplicate-guid-regex",
        file: "src/features/admin/exam-management.ts",
        count: 1,
        allowed: 0,
      },
    ]);
    expect(formatGuardrailViolation(result.violations[0]!)).toContain(
      "Import isGuid or isNullableGuid from @/shared/lib/guards",
    );
  });

  it("catches permissive GUID patterns and RegExp strings outside the shared guard", () => {
    const pattern =
      "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
    const result = runGuardrails({
      files: {
        "src/shared/lib/guards.ts": `const GUID_REGEX = /^${pattern}$/i;`,
        "src/features/demo/api.ts": `const guid = /^${pattern}$/i;`,
        "src/features/demo/server/routes.ts": `const guid = new RegExp("^${pattern}$", "i");`,
        "src/features/demo/note.ts": `// A GUID looks like ${pattern}`,
        "src/features/demo/api.test.ts": `const guid = /^${pattern}$/i;`,
      },
    });
    expect(result.violations.map(({ rule, file }) => ({ rule, file }))).toEqual(
      [
        { rule: "no-duplicate-guid-regex", file: "src/features/demo/api.ts" },
        {
          rule: "no-duplicate-guid-regex",
          file: "src/features/demo/server/routes.ts",
        },
      ],
    );
  });

  it("passes on the real repository production codebase with the Wave 3 ratchet baseline", () => {
    const result = runGuardrails({ rootDir: process.cwd() });
    expect(result.violations).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.checkedFiles).toBeGreaterThan(100);
  });

  it("allows raw <dialog> inside src/shared/components/ui/ and ignores comment mentions", () => {
    const result = runGuardrails({
      baseline: {},
      files: {
        "src/shared/components/ui/custom.tsx": "<dialog open />",
        "src/features/demo/note.tsx":
          "// Do not use <dialog open> or window.alert(1) or as unknown as",
      },
    });
    expect(result.ok).toBe(true);
  });

  it("catches new multiline <dialog open> outside src/shared/components/ui/", () => {
    const result = runGuardrails({
      baseline: {},
      files: {
        "src/features/demo/modal.tsx": `
          export function Modal() {
            return (
              <dialog
                aria-modal="true"
                open
              >
                Hello
              </dialog>
            );
          }
        `,
      },
    });
    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      {
        rule: "no-raw-dialog-open",
        file: "src/features/demo/modal.tsx",
        count: 1,
        allowed: 0,
      },
    ]);
  });

  it("catches window.confirm / globalThis.alert calls in non-test src/", () => {
    const result = runGuardrails({
      baseline: {},
      files: {
        "src/features/demo/page.tsx": `
          export function remove() {
            return window.confirm("Delete?");
          }
        `,
      },
    });
    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      {
        rule: "no-browser-dialogs",
        file: "src/features/demo/page.tsx",
        count: 1,
        allowed: 0,
      },
    ]);
  });

  it("catches duplicate navigator.locks / refreshSession calls outside shared/api and auth/api", () => {
    const result = runGuardrails({
      baseline: {},
      files: {
        "src/features/demo/http.ts": `
          export async function run() {
            return navigator.locks.request("toeicmaster-refresh", async () => {});
          }
        `,
      },
    });
    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      {
        rule: "no-duplicate-auth-refresh",
        file: "src/features/demo/http.ts",
        count: 2,
        allowed: 0,
      },
    ]);
  });

  it("catches double type assertions (as unknown as)", () => {
    const result = runGuardrails({
      baseline: {},
      files: {
        "src/features/demo/mapper.ts": `
          export function map(value: unknown) {
            return value as unknown as { id: string };
          }
        `,
      },
    });
    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      {
        rule: "no-double-cast",
        file: "src/features/demo/mapper.ts",
        count: 1,
        allowed: 0,
      },
    ]);
  });

  it("catches @ts-ignore / @ts-expect-error and unjustified lint-disable comments while allowing justified ones", () => {
    const tsSuppress = runGuardrails({
      baseline: {},
      files: {
        "src/features/demo/a.ts": `// @ts-expect-error bypass\nexport const x = 1;`,
      },
    });
    expect(tsSuppress.ok).toBe(false);
    expect(tsSuppress.violations).toEqual([
      {
        rule: "no-ts-suppress",
        file: "src/features/demo/a.ts",
        count: 1,
        allowed: 0,
      },
    ]);

    const unjustified = runGuardrails({
      baseline: {},
      files: {
        "src/features/demo/b.tsx": `// eslint-disable-next-line @next/next/no-img-element\nexport const img = null;`,
      },
    });
    expect(unjustified.ok).toBe(false);
    expect(unjustified.violations).toEqual([
      {
        rule: "no-unjustified-lint-disable",
        file: "src/features/demo/b.tsx",
        count: 1,
        allowed: 0,
      },
    ]);

    const justified = runGuardrails({
      baseline: {},
      files: {
        "src/features/demo/c.tsx": `// eslint-disable-next-line @next/next/no-img-element -- proxied media has dynamic dimensions\nexport const img = null;`,
      },
    });
    expect(justified.ok).toBe(true);
  });

  it("catches new feature proxy/upstream files that do not import @/shared/server/bff-proxy", () => {
    const legacy = runGuardrails({
      baseline: {},
      files: {
        "src/features/demo/server/demo-proxy.ts": `export async function proxy() { return fetch("http://localhost"); }`,
      },
    });
    expect(legacy.ok).toBe(false);
    expect(legacy.violations).toEqual([
      {
        rule: "no-new-legacy-proxy",
        file: "src/features/demo/server/demo-proxy.ts",
        count: 1,
        allowed: 0,
      },
    ]);

    const modern = runGuardrails({
      baseline: {},
      files: {
        "src/features/demo/server/demo-proxy.ts": `import { createBffProxy } from "@/shared/server/bff-proxy";\nexport const proxy = createBffProxy({ upstreamPath: "/api/v1/demo", auth: "user" });`,
      },
    });
    expect(modern.ok).toBe(true);
  });

  it("enforces the Wave 3 ratchet when an allowlisted file adds 1 extra violation", () => {
    const result = runGuardrails({
      baseline: {
        "no-double-cast": { "src/features/demo/mapper.ts": 1 },
      },
      files: {
        "src/features/demo/mapper.ts":
          "const a = x as unknown as A; const b = y as unknown as B;",
      },
    });
    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      {
        rule: "no-double-cast",
        file: "src/features/demo/mapper.ts",
        count: 2,
        allowed: 1,
      },
    ]);
  });

  it("enforces single-fault isolated sibling patterns across rules", () => {
    expect(
      runGuardrails({
        baseline: {},
        files: {
          "src/features/demo/alert.tsx": `export const notify = () => globalThis.alert("Hi");`,
        },
      }).violations[0]?.rule,
    ).toBe("no-browser-dialogs");

    expect(
      runGuardrails({
        baseline: {},
        files: {
          "src/features/demo/refresh.ts": `export const run = () => refreshSession();`,
        },
      }).violations[0]?.rule,
    ).toBe("no-duplicate-auth-refresh");

    expect(
      runGuardrails({
        baseline: {},
        files: {
          "src/features/demo/ts-ignore.ts": `// @ts-ignore\nexport const a = 1;`,
        },
      }).violations[0]?.rule,
    ).toBe("no-ts-suppress");

    expect(
      runGuardrails({
        baseline: {},
        files: {
          "src/features/demo/oxlint.tsx": `// oxlint-disable-next-line react/rules-of-hooks\nexport const x = 1;`,
        },
      }).violations[0]?.rule,
    ).toBe("no-unjustified-lint-disable");

    expect(
      runGuardrails({
        baseline: {},
        files: {
          "src/features/demo/server/legacy-upstream.ts": `export const proxy = () => fetch("http://api");`,
        },
      }).violations[0]?.rule,
    ).toBe("no-new-legacy-proxy");
  });
});
