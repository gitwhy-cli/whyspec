import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { showCommand } from "../show.js";

function makeTmp(): string {
  return mkdtempSync(join(tmpdir(), "whyspec-show-test-"));
}

function setupChange(tmp: string, name: string, files: Record<string, string>): string {
  const changeDir = join(tmp, ".gitwhy", "changes", name);
  mkdirSync(changeDir, { recursive: true });
  for (const [filename, content] of Object.entries(files)) {
    writeFileSync(join(changeDir, filename), content);
  }
  return changeDir;
}

describe("showCommand", () => {
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

  it("reads all files and outputs valid JSON", async () => {
    const tmp = makeTmp();
    setupChange(tmp, "add-auth", {
      "intent.md": "# Intent: add-auth\n## Decisions to Make\n- [ ] Token format",
      "design.md": "# Design: add-auth\n## Decisions to Make\n- [ ] Use JWT or sessions",
      "tasks.md": "# Tasks: add-auth\n## Tasks\n- [x] Create middleware\n- [ ] Add tests",
      "ctx_abc123.md": "# Auth Context\n<reasoning>\n<decisions>\n- Used JWT — stateless\n</decisions>\n</reasoning>",
    });

    process.cwd = () => tmp;
    await showCommand("add-auth", { json: true });

    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.change_name).toBe("add-auth");
    expect(output.intent).toContain("Intent: add-auth");
    expect(output.design).toContain("Design: add-auth");
    expect(output.tasks).toContain("Tasks: add-auth");
    expect(output.contexts).toHaveLength(1);
    expect(output.contexts[0].id).toBe("ctx_abc123");
  });

  it("computes Decision Bridge delta", async () => {
    const tmp = makeTmp();
    setupChange(tmp, "delta-test", {
      "design.md": "# Design\n## Decisions to Make\n- [ ] Token storage\n- [ ] Hash algorithm",
      "ctx_d1.md": "# Context\n<reasoning>\n<decisions>\n- Token storage: httpOnly cookies\n- Hash algorithm: bcrypt\n</decisions>\n</reasoning>",
    });

    process.cwd = () => tmp;
    await showCommand("delta-test", { json: true });

    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.decision_bridge_delta.planned).toHaveLength(2);
    expect(output.decision_bridge_delta.decided).toHaveLength(2);
  });

  it("detects surprises — decisions not in plan", async () => {
    const tmp = makeTmp();
    setupChange(tmp, "surprise-test", {
      "design.md": "# Design\n## Decisions to Make\n- [ ] Token format",
      "ctx_s1.md": "# Context\n<reasoning>\n<decisions>\n- Added 2FA requirement — security review\n</decisions>\n</reasoning>",
    });

    process.cwd = () => tmp;
    await showCommand("surprise-test", { json: true });

    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.decision_bridge_delta.surprises.length).toBeGreaterThanOrEqual(1);
  });

  it("handles missing files gracefully", async () => {
    const tmp = makeTmp();
    setupChange(tmp, "partial", {
      "intent.md": "# Intent: partial\nSome intent",
    });

    process.cwd = () => tmp;
    await showCommand("partial", { json: true });

    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.change_name).toBe("partial");
    expect(output.design).toBe("");
    expect(output.tasks).toBe("");
    expect(output.contexts).toHaveLength(0);
  });

  it("handles multiple ctx_*.md files", async () => {
    const tmp = makeTmp();
    setupChange(tmp, "multi-ctx", {
      "design.md": "# Design\n## Decisions to Make\n- [ ] API format",
      "ctx_first.md": "# First\n<reasoning>\n<decisions>\n- REST API chosen\n</decisions>\n</reasoning>",
      "ctx_second.md": "# Second\n<reasoning>\n<decisions>\n- Added pagination\n</decisions>\n</reasoning>",
    });

    process.cwd = () => tmp;
    await showCommand("multi-ctx", { json: true });

    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.contexts).toHaveLength(2);
    expect(output.decision_bridge_delta.decided).toHaveLength(2);
  });
});
