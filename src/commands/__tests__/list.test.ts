import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { listCommand } from "../list.js";

function makeTmp(): string {
  return mkdtempSync(join(tmpdir(), "whyspec-list-test-"));
}

describe("listCommand", () => {
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

  it("outputs valid JSON with change details", async () => {
    const tmp = makeTmp();
    const changeDir = join(tmp, ".gitwhy", "changes", "add-auth");
    mkdirSync(changeDir, { recursive: true });
    writeFileSync(join(changeDir, "intent.md"), "# Intent");
    writeFileSync(join(changeDir, "design.md"), "# Design");
    writeFileSync(join(changeDir, "tasks.md"), "# Tasks\n## Tasks\n- [x] Done\n- [ ] Pending");
    writeFileSync(join(changeDir, "ctx_a1.md"), "# Context");

    process.cwd = () => tmp;
    await listCommand({ json: true });

    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.changes).toHaveLength(1);
    const change = output.changes[0];
    expect(change.name).toBe("add-auth");
    expect(change.files_count).toBe(4); // intent + design + tasks + ctx
    expect(change.context_count).toBe(1);
    expect(change.task_progress.completed).toBe(1);
    expect(change.task_progress.total).toBe(2);
  });

  it("lists multiple changes", async () => {
    const tmp = makeTmp();
    mkdirSync(join(tmp, ".gitwhy", "changes", "change-a"), { recursive: true });
    mkdirSync(join(tmp, ".gitwhy", "changes", "change-b"), { recursive: true });
    writeFileSync(join(tmp, ".gitwhy", "changes", "change-a", "intent.md"), "# A");
    writeFileSync(join(tmp, ".gitwhy", "changes", "change-b", "intent.md"), "# B");

    process.cwd = () => tmp;
    await listCommand({ json: true });

    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.changes).toHaveLength(2);
  });

  it("handles empty changes directory", async () => {
    const tmp = makeTmp();
    mkdirSync(join(tmp, ".gitwhy", "changes"), { recursive: true });

    process.cwd = () => tmp;
    await listCommand({ json: true });

    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.changes).toEqual([]);
  });

  it("handles missing .gitwhy directory", async () => {
    const tmp = makeTmp();
    process.cwd = () => tmp;
    await listCommand({ json: true });

    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.changes).toEqual([]);
  });
});
