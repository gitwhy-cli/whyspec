import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, readFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { planCommand, type PlanJsonOutput } from "../plan.js";

const TEST_DIR = join(process.cwd(), ".test-plan-tmp");
const WHYSPEC_DIR = join(TEST_DIR, "whyspec");

// Capture console.log output
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

describe("plan command", () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
    // Override cwd for tests
    process.env.__WHYSPEC_TEST_CWD = TEST_DIR;
    const origCwd = process.cwd;
    process.cwd = () => TEST_DIR;
    // Store to restore later
    (globalThis as Record<string, unknown>).__origCwd = origCwd;
  });

  afterEach(() => {
    process.cwd = (globalThis as Record<string, unknown>).__origCwd as typeof process.cwd;
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("creates change folder with 3 template files", async () => {
    await planCommand("Add JWT Auth", {});
    const changePath = join(WHYSPEC_DIR, "changes", "add-jwt-auth");

    expect(existsSync(changePath)).toBe(true);
    expect(existsSync(join(changePath, "intent.md"))).toBe(true);
    expect(existsSync(join(changePath, "design.md"))).toBe(true);
    expect(existsSync(join(changePath, "tasks.md"))).toBe(true);
  });

  it("auto-initializes whyspec before creating plan files", async () => {
    await planCommand("Auto Init Plan", {});

    expect(existsSync(join(WHYSPEC_DIR, "config.yaml"))).toBe(true);
    expect(existsSync(join(WHYSPEC_DIR, "archive"))).toBe(true);
    expect(existsSync(join(WHYSPEC_DIR, "debug"))).toBe(true);
  });

  it("slugifies the change name correctly", async () => {
    await planCommand("My Cool Feature!!!", {});
    const changePath = join(WHYSPEC_DIR, "changes", "my-cool-feature");
    expect(existsSync(changePath)).toBe(true);
  });

  it("template files contain correct headings", async () => {
    await planCommand("test-feature", {});
    const changePath = join(WHYSPEC_DIR, "changes", "test-feature");

    const intent = readFileSync(join(changePath, "intent.md"), "utf-8");
    expect(intent).toContain("# Intent: test-feature");
    expect(intent).toContain("## Why This Change Exists");
    expect(intent).toContain("## Decisions to Make");

    const design = readFileSync(join(changePath, "design.md"), "utf-8");
    expect(design).toContain("# Design: test-feature");
    expect(design).toContain("## Trade-off Matrix");
    expect(design).toContain("## Decisions to Make");

    const tasks = readFileSync(join(changePath, "tasks.md"), "utf-8");
    expect(tasks).toContain("# Tasks: test-feature");
    expect(tasks).toContain("## Verification");
  });

  it("--json returns structured output and creates the change directory anchor", async () => {
    const output = await captureOutput(() =>
      planCommand("json-test", { json: true }),
    );
    const parsed: PlanJsonOutput = JSON.parse(output);

    expect(parsed.path).toBe("whyspec/changes/json-test");
    expect(parsed.templates.intent).toContain("# Intent: json-test");
    expect(parsed.templates.design).toContain("# Design: json-test");
    expect(parsed.templates.tasks).toContain("# Tasks: json-test");
    expect(typeof parsed.context).toBe("string");
    expect(typeof parsed.rules).toBe("string");

    // JSON mode should still create the change directory and start anchor
    const changePath = join(WHYSPEC_DIR, "changes", "json-test");
    expect(existsSync(changePath)).toBe(true);
    expect(existsSync(join(changePath, ".started"))).toBe(true);
    expect(existsSync(join(changePath, "intent.md"))).toBe(false);
    expect(existsSync(join(changePath, "design.md"))).toBe(false);
    expect(existsSync(join(changePath, "tasks.md"))).toBe(false);
  });

  it("--json includes context and rules from config", async () => {
    // Create config.yaml with custom context and rules
    mkdirSync(WHYSPEC_DIR, { recursive: true });
    writeFileSync(
      join(WHYSPEC_DIR, "config.yaml"),
      'version: "1.0"\ncontext: "We use React + TypeScript"\nrules: "Always write tests first"',
    );

    const output = await captureOutput(() =>
      planCommand("config-test", { json: true }),
    );
    const parsed: PlanJsonOutput = JSON.parse(output);

    expect(parsed.context).toBe("We use React + TypeScript");
    expect(parsed.rules).toBe("Always write tests first");
  });

  it("throws on duplicate change name", async () => {
    await planCommand("dup-test", {});
    await expect(planCommand("dup-test", {})).rejects.toThrow(
      'Change "dup-test" already exists',
    );
  });
});
