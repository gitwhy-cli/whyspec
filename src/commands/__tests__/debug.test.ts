import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { debugCommand } from "../debug.js";

function makeTmp(): string {
  return mkdtempSync(join(tmpdir(), "whyspec-debug-test-"));
}

describe("debugCommand", () => {
  let origCwd: () => string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    origCwd = process.cwd;
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    process.cwd = origCwd;
    logSpy.mockRestore();
  });

  it("creates change directory and debug.md in non-JSON mode", async () => {
    const tmp = makeTmp();
    process.cwd = () => tmp;

    await debugCommand("login button broken", { json: false });

    const debugDir = join(tmp, ".gitwhy", "changes", "login-button-broken");
    expect(existsSync(debugDir)).toBe(true);
    expect(existsSync(join(debugDir, "debug.md"))).toBe(true);
    expect(existsSync(join(debugDir, ".started"))).toBe(true);

    const content = readFileSync(join(debugDir, "debug.md"), "utf-8");
    expect(content).toContain("# Debug: login button broken");
    expect(content).toContain("## Symptoms");
    expect(content).toContain("## Hypotheses");
  });

  it("auto-initializes .gitwhy before creating debug files", async () => {
    const tmp = makeTmp();
    process.cwd = () => tmp;

    await debugCommand("lazy init debug", { json: false });

    expect(existsSync(join(tmp, ".gitwhy", "config.yaml"))).toBe(true);
    expect(existsSync(join(tmp, ".gitwhy", "archive"))).toBe(true);
    expect(existsSync(join(tmp, ".gitwhy", "debug"))).toBe(true);
  });

  it("outputs valid JSON in --json mode and creates debug artifacts", async () => {
    const tmp = makeTmp();
    process.cwd = () => tmp;

    await debugCommand("api timeout", { json: true });

    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output).toHaveProperty("path");
    expect(output).toHaveProperty("template");
    expect(output).toHaveProperty("related_contexts");
    expect(output.path).toBe(".gitwhy/changes/api-timeout");
    expect(output.template).toContain("# Debug: api timeout");

    const debugDir = join(tmp, ".gitwhy", "changes", "api-timeout");
    expect(existsSync(debugDir)).toBe(true);
    expect(existsSync(join(debugDir, ".started"))).toBe(true);
    expect(existsSync(join(debugDir, "debug.md"))).toBe(true);
    expect(readFileSync(join(debugDir, "debug.md"), "utf-8")).toBe(output.template);
  });

  it("includes related contexts from search", async () => {
    const tmp = makeTmp();
    const existingDir = join(tmp, ".gitwhy", "changes", "old-api-work");
    mkdirSync(existingDir, { recursive: true });
    writeFileSync(
      join(existingDir, "ctx_old1.md"),
      "# API Timeout Fix\n## Reasoning\nFixed api timeout error with retry logic",
    );

    process.cwd = () => tmp;
    await debugCommand("api timeout error", { json: true });

    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.related_contexts.length).toBeGreaterThanOrEqual(1);
  });

  it("throws when no name provided", async () => {
    const tmp = makeTmp();
    process.cwd = () => tmp;

    await expect(debugCommand(undefined, { json: false })).rejects.toThrow(
      "Bug description is required",
    );
  });
});
