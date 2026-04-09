/**
 * E2E test scaffolding — exercises the full WhySpec lifecycle.
 *
 * Tests that CAN run now: init → plan → capture → execute → show → search
 * Remaining .todo() tests cover secondary command paths not needed for the
 * core release lifecycle.
 *
 * Each test uses a temporary directory for isolation.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { rmSync } from "node:fs";
import {
  createGitwhyDir,
  writeConfigYaml,
  addToGitignore,
  detectProjectName,
} from "../init.js";
import { planCommand } from "../plan.js";
import { captureCommand } from "../capture.js";
import { executeCommand } from "../execute.js";
import { showCommand } from "../show.js";
import { searchCommand } from "../search.js";

let tmpDir: string;
let origCwd: typeof process.cwd;

function captureOutput(fn: () => Promise<void>): Promise<string> {
  let output = "";
  const original = console.log;
  console.log = (...args: unknown[]) => {
    output += args.map(String).join(" ") + "\n";
  };
  return fn()
    .then(() => {
      console.log = original;
      return output;
    })
    .catch((err) => {
      console.log = original;
      throw err;
    });
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "whyspec-e2e-"));
  origCwd = process.cwd;
  process.cwd = () => tmpDir;
});

afterEach(() => {
  process.cwd = origCwd;
  rmSync(tmpDir, { recursive: true, force: true });
});

// ── Init Lifecycle ─────────────────────────────────────────────────

describe("E2E: init lifecycle", () => {
  it("creates the full .gitwhy/ directory structure", () => {
    createGitwhyDir(tmpDir);

    expect(existsSync(join(tmpDir, ".gitwhy"))).toBe(true);
    expect(existsSync(join(tmpDir, ".gitwhy", "changes"))).toBe(true);
    expect(existsSync(join(tmpDir, ".gitwhy", "archive"))).toBe(true);
    expect(existsSync(join(tmpDir, ".gitwhy", "debug"))).toBe(true);
  });

  it("writes config.yaml with valid structure", () => {
    createGitwhyDir(tmpDir);
    writeConfigYaml(tmpDir, {
      projectName: "e2e-test",
      projectDescription: "E2E test project",
      tools: ["claude-code"],
      telemetry: false,
    });

    const configPath = join(tmpDir, ".gitwhy", "config.yaml");
    expect(existsSync(configPath)).toBe(true);

    const content = readFileSync(configPath, "utf-8");
    expect(content).toContain("e2e-test");
    expect(content).toContain("version:");
  });

  it("adds .gitwhy/ to .gitignore", () => {
    addToGitignore(tmpDir);

    const gitignore = readFileSync(join(tmpDir, ".gitignore"), "utf-8");
    expect(gitignore).toContain(".gitwhy/");
  });

  it("detects project name from package.json", () => {
    writeFileSync(
      join(tmpDir, "package.json"),
      JSON.stringify({ name: "my-project" }),
    );
    expect(detectProjectName(tmpDir)).toBe("my-project");
  });
});

// ── Plan Lifecycle ─────────────────────────────────────────────────

describe("E2E: plan lifecycle", () => {
  it("creates change folder with intent.md, design.md, tasks.md", async () => {
    createGitwhyDir(tmpDir);

    await captureOutput(() => planCommand("add-auth", {}));

    const changePath = join(tmpDir, ".gitwhy", "changes", "add-auth");
    expect(existsSync(changePath)).toBe(true);
    expect(existsSync(join(changePath, "intent.md"))).toBe(true);
    expect(existsSync(join(changePath, "design.md"))).toBe(true);
    expect(existsSync(join(changePath, "tasks.md"))).toBe(true);
  });

  it("creates .started file for commit range detection", async () => {
    createGitwhyDir(tmpDir);

    await captureOutput(() => planCommand("timing-test", {}));

    const startedPath = join(tmpDir, ".gitwhy", "changes", "timing-test", ".started");
    expect(existsSync(startedPath)).toBe(true);

    const content = readFileSync(startedPath, "utf-8").trim();
    expect(() => new Date(content)).not.toThrow();
    expect(new Date(content).getTime()).toBeGreaterThan(0);
  });

  it("--json returns structured plan data", async () => {
    createGitwhyDir(tmpDir);

    const output = await captureOutput(() =>
      planCommand("json-test", { json: true }),
    );
    const parsed = JSON.parse(output);

    expect(parsed.templates).toBeDefined();
    expect(parsed.templates.intent).toContain("# Intent:");
    expect(parsed.templates.design).toContain("# Design:");
    expect(parsed.templates.tasks).toContain("# Tasks:");
  });

  it("rejects duplicate change names", async () => {
    createGitwhyDir(tmpDir);

    await captureOutput(() => planCommand("dup-test", {}));

    await expect(
      captureOutput(() => planCommand("dup-test", {})),
    ).rejects.toThrow();
  });
});

// ── Capture Lifecycle ──────────────────────────────────────────────

describe("E2E: capture lifecycle", () => {
  it("creates ctx_<id>.md in correct XML format", async () => {
    createGitwhyDir(tmpDir);
    await captureOutput(() => planCommand("capture-test", {}));

    await captureOutput(() => captureCommand("capture-test", {}));

    const changePath = join(tmpDir, ".gitwhy", "changes", "capture-test");
    const ctxFiles = readdirSync(changePath).filter((f) =>
      f.startsWith("ctx_"),
    );
    expect(ctxFiles.length).toBe(1);
    expect(ctxFiles[0]).toMatch(/^ctx_[a-z0-9]{8}\.md$/);

    const content = readFileSync(join(changePath, ctxFiles[0]), "utf-8");
    // GitWhy-compatible header
    expect(content).toMatch(/^# capture-test/);
    expect(content).toContain("**Context ID:**");
    expect(content).toContain("**Agent:** whyspec");
    expect(content).toContain("**Date:**");
    expect(content).toContain("**Branch:**");
    // XML body
    expect(content).toContain("<context>");
    expect(content).toContain("<title>");
    expect(content).toContain("<story>");
    expect(content).toContain("<reasoning>");
    expect(content).toContain("</context>");
  });

  it("--json returns template with Decision Bridge data", async () => {
    createGitwhyDir(tmpDir);
    await captureOutput(() => planCommand("json-capture", {}));

    // Write decisions into design.md
    const designPath = join(
      tmpDir, ".gitwhy", "changes", "json-capture", "design.md",
    );
    writeFileSync(
      designPath,
      `# Design: json-capture

## Approach
Use JWT tokens.

## Decisions to Make
- [ ] Token format (JWT vs opaque)
- [x] Storage (httpOnly cookie)

## Questions to Resolve
`,
    );

    const output = await captureOutput(() =>
      captureCommand("json-capture", { json: true }),
    );
    const parsed = JSON.parse(output);

    expect(parsed.template).toContain("<context>");
    expect(parsed.decisions_to_make).toContain("Token format (JWT vs opaque)");
    expect(parsed.decisions_to_make).toContain("Storage (httpOnly cookie)");
  });
});

// ── Execute Lifecycle ──────────────────────────────────────────────

describe("E2E: execute lifecycle", () => {
  it("reads plan and reports task progress", async () => {
    createGitwhyDir(tmpDir);
    await captureOutput(() => planCommand("exec-test", {}));

    // Add tasks to tasks.md
    const tasksPath = join(
      tmpDir, ".gitwhy", "changes", "exec-test", "tasks.md",
    );
    writeFileSync(
      tasksPath,
      `# Tasks: exec-test

## Verification
- [ ] All tests pass

## Tasks
- [x] Set up project structure
- [x] Implement core logic
- [ ] Add error handling
- [ ] Write tests
`,
    );

    const output = await captureOutput(() =>
      executeCommand("exec-test", { json: true }),
    );
    const parsed = JSON.parse(output);

    expect(parsed.change_name).toBe("exec-test");
    expect(parsed.progress.total).toBe(4);
    expect(parsed.progress.completed).toBe(2);
    expect(parsed.progress.remaining).toBe(2);
    expect(parsed.pending_tasks.length).toBe(2);
  });
});

// ── Full Lifecycle: init → plan → capture → execute → show → search ───────

describe("E2E: full init → plan → capture → execute → show → search lifecycle", () => {
  it("completes the core lifecycle without errors", async () => {
    // 1. Init
    createGitwhyDir(tmpDir);
    writeConfigYaml(tmpDir, {
      projectName: "full-lifecycle",
      projectDescription: "Full E2E test",
      tools: ["claude-code"],
      telemetry: false,
    });
    addToGitignore(tmpDir);

    expect(existsSync(join(tmpDir, ".gitwhy", "config.yaml"))).toBe(true);

    // 2. Plan
    await captureOutput(() => planCommand("auth-feature", {}));

    const changePath = join(tmpDir, ".gitwhy", "changes", "auth-feature");
    expect(existsSync(join(changePath, "intent.md"))).toBe(true);
    expect(existsSync(join(changePath, "design.md"))).toBe(true);
    expect(existsSync(join(changePath, "tasks.md"))).toBe(true);

    // 3. Simulate coding — update tasks
    writeFileSync(
      join(changePath, "tasks.md"),
      `# Tasks: auth-feature

## Verification
- [x] Auth endpoint responds 200

## Tasks
- [x] Create auth middleware
- [x] Add JWT validation
- [ ] Write integration tests
`,
    );

    // 4. Capture reasoning
    await captureOutput(() => captureCommand("auth-feature", {}));

    const ctxFiles = readdirSync(changePath).filter((f) =>
      f.startsWith("ctx_"),
    );
    expect(ctxFiles.length).toBe(1);

    // 5. Execute — check progress
    const output = await captureOutput(() =>
      executeCommand("auth-feature", { json: true }),
    );
    const parsed = JSON.parse(output);
    expect(parsed.progress.completed).toBe(2);
    expect(parsed.progress.remaining).toBe(1);
  });

  it("surfaces the captured story through show and search", async () => {
    createGitwhyDir(tmpDir);
    writeConfigYaml(tmpDir, {
      projectName: "full-lifecycle",
      projectDescription: "Full E2E test",
      tools: ["claude-code"],
      telemetry: false,
    });
    addToGitignore(tmpDir);

    await captureOutput(() => planCommand("auth-search", {}));

    const changePath = join(tmpDir, ".gitwhy", "changes", "auth-search");
    writeFileSync(
      join(changePath, "intent.md"),
      `# Intent: auth-search

## Why This Change Exists
We need secure session handling.

## Decisions to Make
- [ ] Token storage mechanism
`,
    );
    writeFileSync(
      join(changePath, "design.md"),
      `# Design: auth-search

## Approach
Use cookies for session storage.

## Decisions to Make
- [ ] Token storage mechanism
`,
    );
    writeFileSync(
      join(changePath, "tasks.md"),
      `# Tasks: auth-search

## Verification
- [x] Auth requests are accepted

## Tasks
- [x] Implement login endpoint
- [x] Store session in cookie
`,
    );

    await captureOutput(() => captureCommand("auth-search", {}));

    const showOutput = await captureOutput(() =>
      showCommand("auth-search", { json: true }),
    );
    const shown = JSON.parse(showOutput);
    expect(shown.change_name).toBe("auth-search");
    expect(shown.contexts).toHaveLength(1);
    expect(shown.decision_bridge_delta.planned).toContain("Token storage mechanism");

    const searchOutput = await captureOutput(() =>
      searchCommand("auth-search", { json: true, limit: 5 }),
    );
    const results = JSON.parse(searchOutput);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((result: { change_name: string }) => result.change_name === "auth-search")).toBe(true);
  });
});

// ── Secondary Command Paths ────────────────────────────────────────

describe("E2E: show command", () => {
  it.todo("renders the rich non-JSON story output");
});

describe("E2E: search command", () => {
  it.todo("filters by --domain option");
  it.todo("respects --limit option in non-JSON mode");
});

describe("E2E: debug command", () => {
  it.todo("creates debug.md with hypothesis template");
  it.todo("--json returns structured debug output");
});

describe("E2E: list command", () => {
  it.todo("lists all active changes with status");
  it.todo("--json returns structured list output");
});

describe("E2E: status command", () => {
  it.todo("shows detailed status for a single change");
  it.todo("--json returns structured status output");
});

describe("E2E: template command", () => {
  it.todo("returns raw template by type");
  it.todo("--json returns template string");
});
