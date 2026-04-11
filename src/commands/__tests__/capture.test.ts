import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  existsSync,
  readFileSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import { captureCommand, type CaptureJsonOutput } from "../capture.js";
import { generateContextId, extractDecisions } from "../../core/context.js";

const TEST_DIR = join(process.cwd(), ".test-capture-tmp");
const WHYSPEC_DIR = join(TEST_DIR, "whyspec");

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

function createChangeFolderWithFiles(
  name: string,
  designContent?: string,
): string {
  const changePath = join(WHYSPEC_DIR, "changes", name);
  mkdirSync(changePath, { recursive: true });
  writeFileSync(
    join(changePath, "intent.md"),
    "# Intent: test\n\n## Why\n\nTest intent.",
  );
  writeFileSync(
    join(changePath, "design.md"),
    designContent ??
      `# Design: test

## Approach

Use JWT tokens.

## Decisions to Make

- [ ] Token storage approach (cookie vs localStorage)
- [ ] Session timeout policy (hard vs sliding)
- [x] Auth library choice (passport.js)

## Questions to Resolve

- How to handle refresh tokens?
`,
  );
  return changePath;
}

describe("generateContextId", () => {
  it("produces ctx_ + 8 alphanumeric characters", () => {
    const id = generateContextId();
    expect(id).toMatch(/^ctx_[a-z0-9]{8}$/);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateContextId()));
    expect(ids.size).toBe(100);
  });
});

describe("extractDecisions", () => {
  it("extracts checkbox items from Decisions to Make section", () => {
    const content = `# Design

## Decisions to Make

- [ ] Token storage
- [x] Auth library
- [ ] Session policy

## Questions
`;
    const decisions = extractDecisions(content);
    expect(decisions).toEqual([
      "Token storage",
      "Auth library",
      "Session policy",
    ]);
  });

  it("stops at the next heading", () => {
    const content = `## Decisions to Make

- [ ] Decision A

## Other Section

- [ ] Not a decision
`;
    expect(extractDecisions(content)).toEqual(["Decision A"]);
  });

  it("returns empty array when section is missing", () => {
    expect(extractDecisions("# No decisions here")).toEqual([]);
  });

  it("handles uppercase X in checkboxes", () => {
    const content = `## Decisions to Make\n\n- [X] Decided thing`;
    expect(extractDecisions(content)).toEqual(["Decided thing"]);
  });
});

describe("capture command", () => {
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

  it("--json returns structured output with Decision Bridge data", async () => {
    createChangeFolderWithFiles("test-change");

    const output = await captureOutput(() =>
      captureCommand("test-change", { json: true }),
    );
    const parsed: CaptureJsonOutput = JSON.parse(output);

    expect(parsed.change_name).toBe("test-change");
    expect(parsed.change_path).toBe("whyspec/changes/test-change");
    expect(parsed.context_id).toMatch(/^ctx_[a-z0-9]{8}$/);
    expect(parsed.file_path).toBe(
      `whyspec/changes/test-change/${parsed.context_id}.md`,
    );
    expect(parsed.template).toContain("<context>");
    expect(parsed.template).toContain("</context>");
    expect(parsed.decisions_to_make).toContain(
      "Token storage approach (cookie vs localStorage)",
    );
    expect(parsed.decisions_to_make).toContain(
      "Session timeout policy (hard vs sliding)",
    );
    expect(parsed.decisions_to_make).toContain(
      "Auth library choice (passport.js)",
    );
    expect(Array.isArray(parsed.commits)).toBe(true);
    expect(Array.isArray(parsed.files_changed)).toBe(true);

    const writtenPath = join(WHYSPEC_DIR, "changes", "test-change", `${parsed.context_id}.md`);
    expect(existsSync(writtenPath)).toBe(true);

    const writtenContent = readFileSync(writtenPath, "utf-8");
    expect(writtenContent).toContain(`**Context ID:** ${parsed.context_id}`);
    expect(writtenContent).toContain(parsed.template.trim());
  });

  it("XML template includes all required tags", async () => {
    createChangeFolderWithFiles("xml-test");

    const output = await captureOutput(() =>
      captureCommand("xml-test", { json: true }),
    );
    const parsed: CaptureJsonOutput = JSON.parse(output);

    // Required tags
    expect(parsed.template).toContain("<title>");
    expect(parsed.template).toContain("<story>");
    expect(parsed.template).toContain("<reasoning>");
    expect(parsed.template).toContain("<decisions>");
    expect(parsed.template).toContain("<rejected>");
    expect(parsed.template).toContain("<tradeoffs>");
    expect(parsed.template).toContain("<files>");

    // Optional tags
    expect(parsed.template).toContain("<agent>");
    expect(parsed.template).toContain("<tags>");
    expect(parsed.template).toContain("<verification>");
    expect(parsed.template).toContain("<risks>");
  });

  it("non-JSON mode writes ctx_<id>.md with metadata header", async () => {
    createChangeFolderWithFiles("ctx-test");

    await captureOutput(() => captureCommand("ctx-test", {}));

    const changePath = join(WHYSPEC_DIR, "changes", "ctx-test");
    const files = readdirSync(changePath).filter((f) =>
      f.startsWith("ctx_"),
    );
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/^ctx_[a-z0-9]{8}\.md$/);

    const content = readFileSync(join(changePath, files[0]), "utf-8");
    // GitWhy-compatible header fields
    expect(content).toMatch(/^# ctx-test/);
    expect(content).toContain("**Context ID:** ctx_");
    expect(content).toContain("**Agent:** whyspec");
    expect(content).toContain("**Branch:**");
    expect(content).toContain("**Date:**");
    // WhySpec supplementary fields
    expect(content).toContain("**Change:** ctx-test");
    expect(content).toContain("**Intent:** whyspec/changes/ctx-test/intent.md");
    expect(content).toContain("**Commits:**");
    expect(content).toContain("<context>");
  });

  it("handles missing design.md gracefully", async () => {
    const changePath = join(WHYSPEC_DIR, "changes", "no-design");
    mkdirSync(changePath, { recursive: true });
    writeFileSync(join(changePath, "intent.md"), "# Intent\n");

    const output = await captureOutput(() =>
      captureCommand("no-design", { json: true }),
    );
    const parsed: CaptureJsonOutput = JSON.parse(output);

    expect(parsed.decisions_to_make).toEqual([]);
    expect(parsed.change_name).toBe("no-design");
    expect(parsed.context_id).toMatch(/^ctx_[a-z0-9]{8}$/);
    expect(existsSync(join(changePath, `${parsed.context_id}.md`))).toBe(true);
  });

  it("auto-detects single change when name not provided", async () => {
    createChangeFolderWithFiles("only-change");

    const output = await captureOutput(() =>
      captureCommand(undefined, { json: true }),
    );
    const parsed: CaptureJsonOutput = JSON.parse(output);
    expect(parsed.change_name).toBe("only-change");
  });

  it("auto-initializes whyspec before resolving the change", async () => {
    await expect(captureCommand("missing-change", {})).rejects.toThrow(
      'Change "missing-change" not found.',
    );

    expect(existsSync(join(WHYSPEC_DIR, "config.yaml"))).toBe(true);
    expect(existsSync(join(WHYSPEC_DIR, "archive"))).toBe(true);
    expect(existsSync(join(WHYSPEC_DIR, "debug"))).toBe(true);
  });
});
