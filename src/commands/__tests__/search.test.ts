import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { searchCommand } from "../search.js";

function makeTmp(): string {
  return mkdtempSync(join(tmpdir(), "whyspec-search-cmd-test-"));
}

describe("searchCommand", () => {
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

  it("outputs valid JSON in --json mode", async () => {
    const tmp = makeTmp();
    const changeDir = join(tmp, ".gitwhy", "changes", "test-change");
    mkdirSync(changeDir, { recursive: true });
    writeFileSync(join(changeDir, "ctx_test1.md"), "# Auth Setup\n## Reasoning\nChose JWT");

    process.cwd = () => tmp;
    await searchCommand("auth", { json: true });

    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toHaveProperty("id");
    expect(parsed[0]).toHaveProperty("score");
    expect(parsed[0]).toHaveProperty("change_name");
    expect(parsed[0]).toHaveProperty("matched_sections");
  });

  it("handles empty results gracefully", async () => {
    const tmp = makeTmp();
    mkdirSync(join(tmp, ".gitwhy", "changes"), { recursive: true });
    process.cwd = () => tmp;

    await searchCommand("nonexistent", { json: true });
    const output = logSpy.mock.calls[0][0];
    expect(JSON.parse(output)).toEqual([]);
  });

  it("respects --limit flag", async () => {
    const tmp = makeTmp();
    const changeDir = join(tmp, ".gitwhy", "changes", "multi");
    mkdirSync(changeDir, { recursive: true });
    for (let i = 0; i < 5; i++) {
      writeFileSync(join(changeDir, `ctx_f${i}.md`), `# Auth ${i}\nAuth content`);
    }

    process.cwd = () => tmp;
    await searchCommand("auth", { json: true, limit: 2 });
    const parsed = JSON.parse(logSpy.mock.calls[0][0]);
    expect(parsed).toHaveLength(2);
  });
});
