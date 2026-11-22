import { expect, type Page } from "@playwright/test";

export interface ViewportSpec {
  readonly name: string;
  readonly width: number;
  readonly height: number;
}

export const STANDARD_VIEWPORTS: readonly ViewportSpec[] = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

export interface HygieneTracker {
  readonly pageErrors: string[];
  readonly consoleErrors: string[];
  readonly serverErrors: string[];
  assertClean: () => void;
}

/** Attaches pageerror, console.error, and HTTP 5xx listeners for Playwright E2E hygiene assertions. */
export function attachConsoleAndNetworkHygiene(page: Page): HygieneTracker {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const serverErrors: string[] = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("response", (response) => {
    if (response.status() >= 500) {
      serverErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  return {
    pageErrors,
    consoleErrors,
    serverErrors,
    assertClean() {
      expect(pageErrors, "Uncaught page errors detected").toEqual([]);
      expect(consoleErrors, "Console error logs detected").toEqual([]);
      expect(serverErrors, "HTTP 5xx responses detected").toEqual([]);
    },
  };
}

/** Verifies documentElement has no unintended horizontal overflow and reports offending selectors if present. */
export async function assertNoHorizontalOverflow(page: Page, label = "page") {
  const report = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth > doc.clientWidth;
    if (!overflow) {
      return {
        overflow: false,
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        offenders: [] as string[],
      };
    }

    const offenders: string[] = [];
    for (const el of Array.from(document.querySelectorAll("*"))) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.right > doc.clientWidth + 1) {
        const idPart = el.id ? `#${el.id}` : "";
        const classPart =
          typeof el.className === "string" && el.className.trim()
            ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}`
            : "";
        offenders.push(
          `${el.tagName.toLowerCase()}${idPart}${classPart} (right=${Math.round(rect.right)})`,
        );
        if (offenders.length >= 8) break;
      }
    }

    return {
      overflow: true,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      offenders,
    };
  });

  expect(
    report.overflow,
    `Horizontal overflow on ${label} (${report.scrollWidth} > ${report.clientWidth}): ${report.offenders.join(", ")}`,
  ).toBe(false);
}

/** Checks responsive geometry (overflow + broken images) across all standard viewports. */
export async function assertResponsiveGeometry(
  page: Page,
  options?: {
    viewports?: readonly ViewportSpec[];
    checkBrokenImages?: boolean;
  },
) {
  const viewports = options?.viewports ?? STANDARD_VIEWPORTS;
  const checkBrokenImages = options?.checkBrokenImages ?? true;

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await assertNoHorizontalOverflow(
      page,
      `${vp.name} (${vp.width}x${vp.height})`,
    );

    if (checkBrokenImages) {
      const brokenImages = await page.evaluate(() =>
        Array.from(document.querySelectorAll("img"))
          .filter((img) => !img.complete || img.naturalWidth === 0)
          .map((img) => img.src),
      );
      expect(
        brokenImages,
        `Broken images detected at ${vp.name} (${vp.width}x${vp.height})`,
      ).toEqual([]);
    }
  }
}
