import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  generateOpenApiTypesFromSpec,
  normalizeOpenApiSchema,
  runContractCommand,
} from "./sync-openapi-types.mjs";

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
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "openapi-contract-"),
    );
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
    await rm(directory, { recursive: true, force: true });
  });

  it("syncs a source byte-for-byte and regenerates types", async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "openapi-contract-"),
    );
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
    await rm(directory, { recursive: true, force: true });
  });
});
