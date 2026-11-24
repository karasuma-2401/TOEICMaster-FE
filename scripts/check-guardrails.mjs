import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

/**
 * Deterministic Wave 1B anti-slop guardrails with per-file TODO(Wave3) ratchets.
 * Adding any new violation (or exceeding any baseline count) fails with exit 1.
 */
export const TODO_WAVE3_BASELINE = {
  "no-duplicate-guid-regex": {},
  "no-raw-bff-fetch": {
    "src/features/flashcards/server/flashcards-proxy.ts": 1,
    "src/features/lr-exam/server/lr-proxy.ts": 1,
    "src/features/speaking/server/speaking-proxy.ts": 1,
    "src/features/writing/server/writing-proxy.ts": 1,
  },
  "no-raw-storage": {
    "src/features/lr-exam/hooks/use-sequential-listening-player.ts": 2,
    "src/features/pronunciation/practice-progress.ts": 1,
    "src/features/user/preferences.ts": 1,
    "src/shared/components/mascot/guide-mascot.tsx": 2,
    "src/shared/components/practice/practice-sidebar.tsx": 2,
  },
  "no-raw-dialog-open": {
    "src/features/admin/components/content/admin-excel-import.tsx": 1,
    "src/features/admin/components/content/admin-overlay.tsx": 2,
    "src/features/admin/components/content/admin-workspace.tsx": 1,
    "src/features/admin/components/data-bank-center.tsx": 1,
    "src/features/knowledge/components/knowledge-category-modal.tsx": 1,
    "src/features/knowledge/components/knowledge-media-picker-modal.tsx": 1,
    "src/features/knowledge/components/knowledge-ui-primitives.tsx": 1,
    "src/features/lr-exam/components/submit-confirm-dialog.tsx": 1,
    "src/features/pronunciation/components/sound-dialog.tsx": 1,
    "src/features/speaking/components/admin/create-test-modal.tsx": 1,
    "src/features/user/components/profile-dialog.tsx": 1,
    "src/features/writing/components/admin-writing-pages.tsx": 3,
    "src/features/writing/components/admin-writing-tests-live.tsx": 2,
  },
  "no-browser-dialogs": {
    "src/features/speaking/components/admin/admin-speaking-content-page.tsx": 1,
    "src/features/speaking/components/admin/speaking-test-workspace.tsx": 2,
    "src/features/speaking/components/session/speaking-attempt.tsx": 1,
    "src/features/writing/components/admin-writing-pages.tsx": 1,
    "src/features/writing/components/admin-writing-tests-live.tsx": 1,
  },
  "no-duplicate-auth-refresh": {
    "src/features/admin/api.ts": 4,
    "src/features/admin/exam-api.ts": 4,
    "src/features/admin/lr-exercise-bank-api.ts": 4,
    "src/features/auth/components/account-controls.tsx": 4,
    "src/features/knowledge/http.ts": 5,
    "src/features/lr-exam/api.ts": 5,
    "src/features/speaking/http.ts": 5,
    "src/features/user/api.ts": 5,
    "src/features/user/components/user-menu.tsx": 4,
    "src/features/writing/http.ts": 5,
  },
  "no-double-cast": {
    "src/features/admin/exam-management.ts": 2,
    "src/features/admin/lr-exercise-bank-api.ts": 2,
    "src/features/admin/users.ts": 1,
    "src/features/speaking/admin-api.ts": 1,
    "src/features/writing/attempt-api.ts": 5,
  },
  "no-ts-suppress": {},
  "no-unjustified-lint-disable": {
    "src/features/flashcards/components/flashcard-match-game.tsx": 1,
    "src/features/flashcards/components/flashcard-quiz-mode.tsx": 1,
    "src/features/flashcards/components/flashcards-workspace.tsx": 2,
    "src/features/knowledge/components/knowledge-article-preview.tsx": 2,
    "src/features/knowledge/components/knowledge-articles-tab.tsx": 1,
    "src/features/knowledge/components/knowledge-editor-sidebar.tsx": 1,
    "src/features/knowledge/components/knowledge-media-picker-modal.tsx": 1,
    "src/features/knowledge/components/knowledge-media-tab.tsx": 1,
    "src/features/lr-exam/hooks/use-sequential-listening-player.ts": 1,
    "src/features/writing/components/sentence-diff-view.tsx": 1,
  },
  "no-new-legacy-proxy": {
    "src/features/admin/server/admin-exams-proxy.ts": 1,
    "src/features/admin/server/admin-users-proxy.ts": 1,
    "src/features/flashcards/server/flashcards-proxy.ts": 1,
    "src/features/knowledge/server/admin-knowledge-proxy.ts": 1,
    "src/features/lr-exam/server/lr-proxy.ts": 1,
    "src/features/pronunciation/server/upstream.ts": 1,
    "src/features/speaking/server/admin-speaking-proxy.ts": 1,
    "src/features/speaking/server/speaking-proxy.ts": 1,
    "src/features/speaking/server/upstream.ts": 1,
    "src/features/user/server/profile-proxy.ts": 1,
    "src/features/writing/server/admin-writing-proxy.ts": 1,
    "src/features/writing/server/writing-proxy.ts": 1,
  },
};

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

/** Strips JS/TS line and block comments using TypeScript compiler API, preserving string literals, templates, and regexes. */
export function stripComments(source) {
  const sf = ts.createSourceFile(
    "source.tsx",
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TSX,
  );
  const commentRanges = new Map();

  function addComments(ranges) {
    if (!ranges) return;
    for (const r of ranges) {
      commentRanges.set(`${r.pos}-${r.end}`, r);
    }
  }

  function visit(node) {
    addComments(ts.getLeadingCommentRanges(source, node.getFullStart()));
    addComments(ts.getTrailingCommentRanges(source, node.getEnd()));
    for (const child of node.getChildren(sf)) {
      visit(child);
    }
  }

  visit(sf);
  addComments(ts.getTrailingCommentRanges(source, sf.getEnd()));

  const list = Array.from(commentRanges.values()).sort((a, b) => a.pos - b.pos);
  let output = "";
  let lastPos = 0;
  for (const c of list) {
    output += source.slice(lastPos, c.pos);
    const comment = source.slice(c.pos, c.end);
    output += comment.replace(/[^\r\n]/g, " ");
    lastPos = c.end;
  }
  output += source.slice(lastPos);
  return output;
}

function isProductionSourceFile(relPath) {
  if (!/\.(ts|tsx)$/.test(relPath)) return false;
  if (/\.test\.(ts|tsx)$/.test(relPath)) return false;
  if (relPath.startsWith("src/test/")) return false;
  return true;
}

function collectSourceFiles(rootDir) {
  const srcRoot = path.join(rootDir, "src");
  if (!fs.existsSync(srcRoot)) return [];
  const results = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        const rel = toPosix(path.relative(rootDir, fullPath));
        if (isProductionSourceFile(rel)) {
          results.push({ rel, fullPath });
        }
      }
    }
  }

  walk(srcRoot);
  results.sort((a, b) => a.rel.localeCompare(b.rel));
  return results;
}

/** Counts guardrail rule violations in a single production source file. */
export function inspectSourceFile(relPath, raw) {
  const stripped = stripComments(raw);
  const findings = {};

  if (relPath !== "src/shared/lib/guards.ts") {
    const guidMatches = stripped.match(
      /\[(?:0-9a-f|a-f0-9|0-9a-fA-F|a-fA-F0-9|[0-9a-fA-F\-])+\]\{8\}-\[(?:0-9a-f|a-f0-9|0-9a-fA-F|a-fA-F0-9|[0-9a-fA-F\-])+\]\{4\}-/gi,
    );
    if (guidMatches) {
      findings["no-duplicate-guid-regex"] = guidMatches.length;
    }
  }

  if (relPath !== "src/shared/lib/storage.ts") {
    const storageMatches = stripped.match(
      /\b(?:localStorage|sessionStorage)\b/g,
    );
    if (storageMatches) {
      findings["no-raw-storage"] = storageMatches.length;
    }
  }

  if (!relPath.startsWith("src/shared/components/ui/")) {
    const dialogMatches = stripped.match(/<dialog\b(?![a-zA-Z0-9_-])/g);
    if (dialogMatches) {
      findings["no-raw-dialog-open"] = dialogMatches.length;
    }
  }

  const browserDialogMatches = stripped.match(
    /\b(?:window|globalThis)\.(?:confirm|alert)\s*\(/g,
  );
  if (browserDialogMatches) {
    findings["no-browser-dialogs"] = browserDialogMatches.length;
  }

  if (
    !relPath.startsWith("src/shared/api/") &&
    relPath !== "src/features/auth/api.ts"
  ) {
    const refreshMatches = stripped.match(
      /\bnavigator\.locks\b|["'`]toeicmaster-refresh["'`]|\brefreshSession\s*\(/g,
    );
    if (refreshMatches) {
      findings["no-duplicate-auth-refresh"] = refreshMatches.length;
    }
  }

  const doubleCastMatches = stripped.match(/\bas\s+unknown\s+as\b/g);
  if (doubleCastMatches) {
    findings["no-double-cast"] = doubleCastMatches.length;
  }

  for (const line of raw.split(/\r?\n/)) {
    if (/@ts-(?:ignore|expect-error)\b/.test(line)) {
      findings["no-ts-suppress"] = (findings["no-ts-suppress"] ?? 0) + 1;
    } else if (/(?:eslint|oxlint)-disable(?:-next-line|-line)?\b/.test(line)) {
      const cleaned = line.replace(/\*\/\s*\}?\s*$/, "").trim();
      if (!/--\s+\S/.test(cleaned)) {
        findings["no-unjustified-lint-disable"] =
          (findings["no-unjustified-lint-disable"] ?? 0) + 1;
      }
    }
  }

  if (
    relPath.startsWith("src/features/") &&
    /(?:proxy|upstream).*\.ts$/.test(path.posix.basename(relPath)) &&
    !raw.includes("@/shared/server/bff-proxy")
  ) {
    findings["no-new-legacy-proxy"] = 1;
  }

  if (
    (relPath.startsWith("src/app/api/") ||
      /^src\/features\/.+\/server\//.test(relPath)) &&
    relPath !== "src/features/auth/server/backend.ts"
  ) {
    const rawFetchMatches = stripped.match(/\bfetch\s*\(/g);
    if (rawFetchMatches) {
      findings["no-raw-bff-fetch"] = rawFetchMatches.length;
    }
  }

  return findings;
}

/**
 * Runs all guardrail checks against `rootDir` (or an injected virtual file map) and returns failures.
 * @param {{
 *   rootDir?: string;
 *   files?: Record<string, string> | null;
 *   baseline?: Record<string, Record<string, number>>;
 * }} [options]
 */
export function runGuardrails({
  rootDir = process.cwd(),
  files = null,
  baseline = TODO_WAVE3_BASELINE,
} = {}) {
  const entries = files
    ? Object.entries(files)
        .filter(([rel]) => isProductionSourceFile(toPosix(rel)))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([rel, content]) => ({ rel: toPosix(rel), content }))
    : collectSourceFiles(rootDir).map(({ rel, fullPath }) => ({
        rel,
        content: fs.readFileSync(fullPath, "utf8"),
      }));

  const violations = [];

  for (const { rel, content } of entries) {
    const fileFindings = inspectSourceFile(rel, content);
    for (const [rule, count] of Object.entries(fileFindings)) {
      const allowed = baseline[rule]?.[rel] ?? 0;
      if (count > allowed) {
        violations.push({
          rule,
          file: rel,
          count,
          allowed,
        });
      }
    }
  }

  return {
    ok: violations.length === 0,
    checkedFiles: entries.length,
    violations,
  };
}

const RULE_REMEDIATIONS = {
  "no-duplicate-guid-regex":
    "Import isGuid or isNullableGuid from @/shared/lib/guards instead of defining a GUID regex.",
  "no-raw-bff-fetch":
    "Use createBffProxy or forwardBffRequest from @/shared/server/bff-proxy instead of raw fetch in BFF routes and server proxies.",
  "no-raw-storage":
    "Use readScopedStorage or writeScopedStorage from @/shared/lib/storage with an explicit user and namespace scope.",
};

export function formatGuardrailViolation({ rule, file, count, allowed }) {
  const remediation = RULE_REMEDIATIONS[rule];
  return `[${rule}] ${file}: found ${count} (baseline allowlist: ${allowed})${remediation ? ` ${remediation}` : ""}`;
}

function main() {
  const result = runGuardrails();
  if (!result.ok) {
    console.error("Anti-slop guardrail check failed:");
    for (const violation of result.violations) {
      console.error(`  ${formatGuardrailViolation(violation)}`);
    }
    process.exitCode = 1;
    return;
  }
  console.log(
    `Guardrails passed (${result.checkedFiles} production files checked).`,
  );
}

const isEntrypoint =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isEntrypoint) {
  main();
}
