import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { executeCommand, parseTasks, type ExecuteJsonOutput } from "../execute.js";

const TEST_DIR = join(process.cwd(), ".test-execute-tmp");
const GITWHY_DIR = join(TEST_DIR, ".gitwhy");

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

function createChangeFolderWithTasks(
  name: string,
  tasksContent: string,
): void {
  const changePath = join(GITWHY_DIR, "changes", name);
  mkdirSync(changePath, { recursive: true });
  writeFileSync(join(changePath, "intent.md"), "# Intent\n\nTest intent.");
  writeFileSync(join(changePath, "design.md"), "# Design\n\nTest design.");
  writeFileSync(join(changePath, "tasks.md"), tasksContent);
}

describe("parseTasks", () => {
  it("counts completed and pending tasks", () => {
    const content = `# Tasks

## Verification

Tests pass.

## Tasks

- [x] Set up project structure
- [x] Add authentication
- [ ] Implement rate limiting
- [ ] Add logging
`;
    const { progress, pending } = parseTasks(content);
    expect(progress.total).toBe(4);
    expect(progress.completed).toBe(2);
    expect(progress.remaining).toBe(2);
    expect(pending).toHaveLength(2);
    expect(pending[0].description).toBe("Implement rate limiting");
    expect(pending[1].description).toBe("Add logging");
  });

  it("handles uppercase X checkbox", () => {
    const { progress } = parseTasks("## Tasks\n\n- [X] Done task\n- [ ] Pending task");
    expect(progress.completed).toBe(1);
    expect(progress.remaining).toBe(1);
  });

  it("returns zero progress for empty content", () => {
    const { progress, pending } = parseTasks("");
    expect(progress.total).toBe(0);
    expect(progress.completed).toBe(0);
    expect(progress.remaining).toBe(0);
    expect(pending).toEqual([]);
  });

  it("ignores non-checkbox list items", () => {
    const content = `## Tasks\n\n- Regular list item
- Another item
- [x] Actual task
- [ ] Pending task`;
    const { progress } = parseTasks(content);
    expect(progress.total).toBe(2);
  });

  it("tracks line numbers correctly", () => {
    const content = `## Tasks

- [x] Done
- [ ] Pending on line 4
- [x] Another done
- [ ] Pending on line 6`;
    const { pending } = parseTasks(content);
    expect(pending[0].line).toBe(4);
    expect(pending[0].description).toBe("Pending on line 4");
    expect(pending[1].line).toBe(6);
    expect(pending[1].description).toBe("Pending on line 6");
  });

  it("handles all completed tasks", () => {
    const content = "## Tasks\n\n- [x] Task 1\n- [x] Task 2\n- [X] Task 3";
    const { progress, pending } = parseTasks(content);
    expect(progress.total).toBe(3);
    expect(progress.completed).toBe(3);
    expect(progress.remaining).toBe(0);
    expect(pending).toEqual([]);
  });
});

describe("execute command", () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
    const origCwd = process.cwd;
    process.cwd = () => TEST_DIR;
    (globalThis as Record<string, unknown>).__origCwd = origCwd;
  });

  afterEach(() => {
    process.cwd = (globalThis as Record<string, unknown>).__origCwd as typeof process.cwd;
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("--json returns full execution context", async () => {
    createChangeFolderWithTasks(
      "exec-test",
      "# Tasks\n\n## Verification\n\n- [ ] Tests pass\n\n## Tasks\n\n- [x] Setup\n- [ ] Implement\n- [ ] Test",
    );

    const output = await captureOutput(() =>
      executeCommand("exec-test", { json: true }),
    );
    const parsed: ExecuteJsonOutput = JSON.parse(output);

    expect(parsed.change_name).toBe("exec-test");
    expect(parsed.intent).toContain("# Intent");
    expect(parsed.design).toContain("# Design");
    expect(parsed.tasks).toContain("# Tasks");
    expect(parsed.intent_content).toContain("# Intent");
    expect(parsed.design_content).toContain("# Design");
    expect(parsed.tasks_content).toContain("# Tasks");
    expect(parsed.progress.total).toBe(3);
    expect(parsed.progress.completed).toBe(1);
    expect(parsed.progress.remaining).toBe(2);
    expect(parsed.pending_tasks).toHaveLength(2);
    expect(parsed.pending_tasks[0].description).toBe("Implement");
    expect(parsed.pending_tasks[1].description).toBe("Test");
  });

  it("handles missing tasks.md gracefully", async () => {
    const changePath = join(GITWHY_DIR, "changes", "no-tasks");
    mkdirSync(changePath, { recursive: true });
    writeFileSync(join(changePath, "intent.md"), "# Intent");
    writeFileSync(join(changePath, "design.md"), "# Design");
    // No tasks.md

    const output = await captureOutput(() =>
      executeCommand("no-tasks", { json: true }),
    );
    const parsed: ExecuteJsonOutput = JSON.parse(output);

    expect(parsed.intent).toContain("# Intent");
    expect(parsed.design).toContain("# Design");
    expect(parsed.tasks_content).toBe("");
    expect(parsed.tasks).toBe("");
    expect(parsed.progress.total).toBe(0);
    expect(parsed.progress.completed).toBe(0);
    expect(parsed.pending_tasks).toEqual([]);
  });

  it("handles all files missing gracefully", async () => {
    const changePath = join(GITWHY_DIR, "changes", "empty-change");
    mkdirSync(changePath, { recursive: true });

    const output = await captureOutput(() =>
      executeCommand("empty-change", { json: true }),
    );
    const parsed: ExecuteJsonOutput = JSON.parse(output);

    expect(parsed.intent).toBe("");
    expect(parsed.design).toBe("");
    expect(parsed.tasks).toBe("");
    expect(parsed.intent_content).toBe("");
    expect(parsed.design_content).toBe("");
    expect(parsed.tasks_content).toBe("");
    expect(parsed.progress.total).toBe(0);
  });

  it("throws when change folder does not exist", async () => {
    await expect(
      executeCommand("nonexistent", { json: true }),
    ).rejects.toThrow('Change "nonexistent" not found');
  });

  it("auto-detects single change when name not provided", async () => {
    createChangeFolderWithTasks("only-one", "## Tasks\n\n- [x] Done\n- [ ] Pending");

    const output = await captureOutput(() =>
      executeCommand(undefined, { json: true }),
    );
    const parsed: ExecuteJsonOutput = JSON.parse(output);
    expect(parsed.change_name).toBe("only-one");
  });

  it("non-JSON mode displays progress summary", async () => {
    createChangeFolderWithTasks(
      "display-test",
      "## Tasks\n\n- [x] Done\n- [x] Also done\n- [ ] Pending",
    );

    const output = await captureOutput(() =>
      executeCommand("display-test", {}),
    );

    expect(output).toContain("display-test");
    expect(output).toContain("2/3");
    expect(output).toContain("Pending");
  });
});
