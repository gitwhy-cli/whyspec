import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { statusCommand } from "../status.js";

function makeTmp(): string {
  return mkdtempSync(join(tmpdir(), "whyspec-status-test-"));
}

describe("statusCommand", () => {
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

  it("outputs valid JSON with file presence and progress", async () => {
    const tmp = makeTmp();
    const changeDir = join(tmp, ".gitwhy", "changes", "add-auth");
    mkdirSync(changeDir, { recursive: true });
    writeFileSync(join(changeDir, "intent.md"), "# Intent");
    writeFileSync(join(changeDir, "design.md"), "# Design\n## Decisions to Make\n- [ ] Token type\n- [ ] Hash algo");
    writeFileSync(join(changeDir, "tasks.md"), "# Tasks\n## Tasks\n- [x] Create middleware\n- [ ] Add tests");
    writeFileSync(join(changeDir, "ctx_a1.md"), "# Context\n<reasoning>\n<decisions>\n- Used JWT\n</decisions>\n</reasoning>");

    process.cwd = () => tmp;
    await statusCommand("add-auth", { json: true });

    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.name).toBe("add-auth");
    expect(output.files.intent).toBe(true);
    expect(output.files.design).toBe(true);
    expect(output.files.tasks).toBe(true);
    expect(output.files.debug).toBe(false);
    expect(output.files.contexts).toContain("ctx_a1");
    expect(output.progress.completed).toBe(1);
    expect(output.progress.total).toBe(2);
    expect(output.decision_bridge.to_make).toBe(2);
    expect(output.decision_bridge.made).toBe(1);
  });

  it("handles change with no files", async () => {
    const tmp = makeTmp();
    mkdirSync(join(tmp, ".gitwhy", "changes", "empty-change"), { recursive: true });

    process.cwd = () => tmp;
    await statusCommand("empty-change", { json: true });

    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.files.intent).toBe(false);
    expect(output.files.design).toBe(false);
    expect(output.files.tasks).toBe(false);
    expect(output.files.debug).toBe(false);
    expect(output.files.contexts).toEqual([]);
    expect(output.progress.total).toBe(0);
  });

  it("throws for non-existent change", async () => {
    const tmp = makeTmp();
    mkdirSync(join(tmp, ".gitwhy", "changes"), { recursive: true });
    process.cwd = () => tmp;

    await expect(statusCommand("nonexistent", { json: true })).rejects.toThrow();
  });
});
