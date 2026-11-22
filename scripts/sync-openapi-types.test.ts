import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import {
  generateOpenApiTypesFromSpec,
  normalizeOpenApiSchema,
  parseArgs,
  runContractCommand,
} from "./sync-openapi-types.mjs";

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "sync-openapi-types.mjs",
);

async function withTempDir<T>(
  run: (directory: string) => Promise<T>,
): Promise<T> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "openapi-contract-"));
  try {
    return await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

describe("OpenAPI contract codegen", () => {
  it("normalizes .NET numeric string unions without mutating input", () => {
    const input = {
      type: ["null", "integer", "string"],
      pattern: "^-?(?:0|[1-9]\\d*)$",
    };
    expect(normalizeOpenApiSchema(input)).toEqual({
      type: ["null", "integer"],
    });
    expect(input.type).toEqual(["null", "integer", "string"]);
  });

  it("infers string enum schemas", () => {
    expect(normalizeOpenApiSchema({ enum: ["Draft", "Published"] })).toEqual({
      enum: ["Draft", "Published"],
      type: "string",
    });
  });

  it("generates deterministic output", async () => {
    const spec = {
      openapi: "3.1.1",
      paths: {},
      components: {
        schemas: {
          Count: {
            type: ["integer", "string"],
            pattern: "^-?(?:0|[1-9]\\d*)$",
          },
        },
      },
    };
    const first = await generateOpenApiTypesFromSpec(spec);
    const second = await generateOpenApiTypesFromSpec(spec);
    expect(first).toBe(second);
    expect(first).toContain("Count: number;");
  });

  it("detects and repairs generated drift in an isolated directory", async () => {
    await withTempDir(async (directory) => {
      const snapshotPath = path.join(directory, "openapi.json");
      const outputPath = path.join(directory, "openapi.types.ts");
      const spec = { openapi: "3.1.1", paths: {}, components: { schemas: {} } };
      await writeFile(snapshotPath, JSON.stringify(spec));
      await writeFile(outputPath, "drift\n");
      await expect(
        runContractCommand({ mode: "check", snapshotPath, outputPath }),
      ).rejects.toThrow("out of sync");
      await runContractCommand({ mode: "generate", snapshotPath, outputPath });
      await expect(
        runContractCommand({ mode: "check", snapshotPath, outputPath }),
      ).resolves.toMatchObject({ drifted: false });
    });
  });

  it("rejects missing outputPath during check", async () => {
    await withTempDir(async (directory) => {
      const snapshotPath = path.join(directory, "openapi.json");
      const missingOutputPath = path.join(directory, "missing.types.ts");
      const spec = { openapi: "3.1.1", paths: {}, components: { schemas: {} } };
      await writeFile(snapshotPath, JSON.stringify(spec));
      await expect(
        runContractCommand({
          mode: "check",
          snapshotPath,
          outputPath: missingOutputPath,
        }),
      ).rejects.toThrow("Generated OpenAPI types are missing");
    });
  });

  it("syncs a source byte-for-byte and regenerates types", async () => {
    await withTempDir(async (directory) => {
      const sourcePath = path.join(directory, "source.json");
      const snapshotPath = path.join(directory, "openapi.json");
      const outputPath = path.join(directory, "openapi.types.ts");
      const source = '{\n  "openapi": "3.1.1",\n  "paths": {}\n}\n';
      await writeFile(sourcePath, source);
      await runContractCommand({
        mode: "sync",
        sourcePath,
        snapshotPath,
        outputPath,
      });
      expect(await readFile(snapshotPath, "utf8")).toBe(source);
      expect(await readFile(outputPath, "utf8")).toContain("export type paths");
    });
  });

  it("resolves OPENAPI_SOURCE_PATH when sourcePath is omitted", async () => {
    await withTempDir(async (directory) => {
      const sourcePath = path.join(directory, "env-source.json");
      const snapshotPath = path.join(directory, "openapi.json");
      const outputPath = path.join(directory, "openapi.types.ts");
      const source = '{\n  "openapi": "3.1.1",\n  "paths": {}\n}\n';
      await writeFile(sourcePath, source);
      const previousEnv = process.env.OPENAPI_SOURCE_PATH;
      process.env.OPENAPI_SOURCE_PATH = sourcePath;
      try {
        await runContractCommand({ mode: "sync", snapshotPath, outputPath });
        expect(await readFile(snapshotPath, "utf8")).toBe(source);
        expect(await readFile(outputPath, "utf8")).toContain(
          "export type paths",
        );
      } finally {
        if (previousEnv === undefined) {
          delete process.env.OPENAPI_SOURCE_PATH;
        } else {
          process.env.OPENAPI_SOURCE_PATH = previousEnv;
        }
      }
    });
  });

  it("rejects missing, malformed, and invalid OpenAPI sources", async () => {
    await withTempDir(async (directory) => {
      const snapshotPath = path.join(directory, "openapi.json");
      const outputPath = path.join(directory, "openapi.types.ts");
      const missingPath = path.join(directory, "does-not-exist.json");
      await expect(
        runContractCommand({
          mode: "sync",
          sourcePath: missingPath,
          snapshotPath,
          outputPath,
        }),
      ).rejects.toThrow(`OpenAPI source file not found: ${missingPath}`);

      const invalidJsonPath = path.join(directory, "invalid.json");
      await writeFile(invalidJsonPath, "{not-json");
      await expect(
        runContractCommand({
          mode: "sync",
          sourcePath: invalidJsonPath,
          snapshotPath,
          outputPath,
        }),
      ).rejects.toThrow(`OpenAPI source is not valid JSON: ${invalidJsonPath}`);

      const missingFieldsPath = path.join(directory, "missing-fields.json");
      await writeFile(missingFieldsPath, JSON.stringify({ openapi: "3.1.1" }));
      await expect(
        runContractCommand({
          mode: "sync",
          sourcePath: missingFieldsPath,
          snapshotPath,
          outputPath,
        }),
      ).rejects.toThrow(
        `OpenAPI source must contain "openapi" and "paths": ${missingFieldsPath}`,
      );

      const arrayRootPath = path.join(directory, "array-root.json");
      await writeFile(arrayRootPath, JSON.stringify([]));
      await expect(
        runContractCommand({
          mode: "sync",
          sourcePath: arrayRootPath,
          snapshotPath,
          outputPath,
        }),
      ).rejects.toThrow(
        `OpenAPI source must contain "openapi" and "paths": ${arrayRootPath}`,
      );

      const arrayPathsPath = path.join(directory, "array-paths.json");
      await writeFile(
        arrayPathsPath,
        JSON.stringify({ openapi: "3.1.1", paths: [] }),
      );
      await expect(
        runContractCommand({
          mode: "sync",
          sourcePath: arrayPathsPath,
          snapshotPath,
          outputPath,
        }),
      ).rejects.toThrow(
        `OpenAPI source must contain "openapi" and "paths": ${arrayPathsPath}`,
      );
    });
  });

  it("rejects missing --source argument and exits non-zero from CLI on errors", async () => {
    expect(() => parseArgs(["sync", "--source"])).toThrow(
      "Missing value for --source.",
    );
    expect(() => parseArgs(["invalid"])).toThrow("Usage:");

    await expect(
      execFileAsync(process.execPath, [SCRIPT_PATH, "sync", "--source"]),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining("Missing value for --source."),
    });
  });
});
