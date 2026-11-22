import { readFile, writeFile, copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_SNAPSHOT = path.join(ROOT, "docs/contracts/openapi.json");
const DEFAULT_OUTPUT = path.join(
  ROOT,
  "src/shared/api/generated/openapi.types.ts",
);

function isNumericPattern(pattern) {
  return (
    typeof pattern === "string" &&
    pattern.startsWith("^-?(?:") &&
    pattern.includes("\\d")
  );
}

export function normalizeOpenApiSchema(node) {
  if (Array.isArray(node)) return node.map(normalizeOpenApiSchema);
  if (!node || typeof node !== "object") return node;

  const record = Object.fromEntries(
    Object.entries(node).map(([key, value]) => [
      key,
      normalizeOpenApiSchema(value),
    ]),
  );
  const types = Array.isArray(record.type) ? record.type : undefined;
  if (
    types?.includes("string") &&
    (types.includes("integer") || types.includes("number")) &&
    isNumericPattern(record.pattern)
  ) {
    const normalizedTypes = types.filter((type) => type !== "string");
    record.type =
      normalizedTypes.length === 1 ? normalizedTypes[0] : normalizedTypes;
    delete record.pattern;
  }
  if (
    Array.isArray(record.enum) &&
    record.enum.length > 0 &&
    record.enum.every((value) => typeof value === "string") &&
    record.type === undefined
  ) {
    record.type = "string";
  }
  return record;
}

export async function generateOpenApiTypesFromSpec(spec) {
  const normalized = normalizeOpenApiSchema(spec);
  const ast = await openapiTS(normalized, { alphabetize: true });
  return `${astToString(ast).replaceAll("\r\n", "\n").trimEnd()}\n`;
}

async function readSpec(filePath) {
  let contents;
  try {
    contents = await readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(`OpenAPI source file not found: ${filePath}`, {
      cause: error,
    });
  }
  let spec;
  try {
    spec = JSON.parse(contents);
  } catch (error) {
    throw new Error(`OpenAPI source is not valid JSON: ${filePath}`, {
      cause: error,
    });
  }
  if (
    !spec ||
    typeof spec !== "object" ||
    spec.openapi === undefined ||
    !spec.paths
  ) {
    throw new Error(
      `OpenAPI source must contain "openapi" and "paths": ${filePath}`,
    );
  }
  return { contents, spec };
}

/**
 * @param {{ mode: "sync" | "generate" | "check", snapshotPath?: string, outputPath?: string, sourcePath?: string }} options
 */
export async function runContractCommand({
  mode,
  snapshotPath = DEFAULT_SNAPSHOT,
  outputPath = DEFAULT_OUTPUT,
  sourcePath = undefined,
}) {
  const source =
    sourcePath ??
    process.env.OPENAPI_SOURCE_PATH ??
    path.join(ROOT, "../TOEICMaster-BE/docs/contracts/openapi.json");
  if (mode === "sync") {
    const { contents, spec } = await readSpec(source);
    await mkdir(path.dirname(snapshotPath), { recursive: true });
    await writeFile(snapshotPath, contents);
    const generated = await generateOpenApiTypesFromSpec(spec);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, generated);
    return { changed: true, drifted: false, snapshotPath, outputPath };
  }

  const snapshot = await readSpec(snapshotPath);
  const generated = await generateOpenApiTypesFromSpec(snapshot.spec);
  if (mode === "generate") {
    let current = "";
    try {
      current = await readFile(outputPath, "utf8");
    } catch {
      // A missing generated file is created by generate.
    }
    const changed = current !== generated;
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, generated);
    return { changed, drifted: false, snapshotPath, outputPath };
  }

  let current;
  try {
    current = await readFile(outputPath, "utf8");
  } catch {
    throw new Error(
      `Generated OpenAPI types are missing: ${outputPath}. Run npm run contract:generate or npm run contract:sync.`,
    );
  }
  if (current !== generated) {
    throw new Error(
      `Generated OpenAPI types are out of sync: ${outputPath}. Run npm run contract:generate or npm run contract:sync.`,
    );
  }
  return { changed: false, drifted: false, snapshotPath, outputPath };
}

function parseArgs(argv) {
  const mode = argv[0];
  if (!mode || !["sync", "generate", "check"].includes(mode)) {
    throw new Error(
      "Usage: node scripts/sync-openapi-types.mjs <sync|generate|check> [--source <path>]",
    );
  }
  const sourceIndex = argv.indexOf("--source");
  return {
    mode,
    sourcePath: sourceIndex >= 0 ? argv[sourceIndex + 1] : undefined,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await runContractCommand(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
