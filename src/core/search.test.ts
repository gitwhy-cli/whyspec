import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  splitMarkdownSections,
  computeSearchScore,
  searchChanges,
} from "./search.js";

function makeTmp(): string {
  return mkdtempSync(join(tmpdir(), "whyspec-search-test-"));
}

describe("splitMarkdownSections", () => {
  it("extracts title from first H1", () => {
    const sections = splitMarkdownSections("# My Title\n\nSome content");
    expect(sections["title"]).toBe("My Title");
  });

  it("extracts H2 sections", () => {
    const content = `# Title
## Reasoning
Some reasoning here
## Files
path/to/file.ts
## Other
Other content`;
    const sections = splitMarkdownSections(content);
    expect(sections["title"]).toBe("Title");
    expect(sections["reasoning"]).toContain("Some reasoning here");
    expect(sections["files"]).toContain("path/to/file.ts");
    expect(sections["other"]).toContain("Other content");
  });

  it("lowercases section names", () => {
    const sections = splitMarkdownSections("## Reasoning\ntext\n## What Was Done\nmore");
    expect(sections["reasoning"]).toBe("text");
    expect(sections["what was done"]).toBe("more");
  });

  it("returns empty map for empty content", () => {
    expect(splitMarkdownSections("")).toEqual({});
  });

  it("handles content with only a title", () => {
    const sections = splitMarkdownSections("# Just a Title");
    expect(sections["title"]).toBe("Just a Title");
    expect(Object.keys(sections)).toHaveLength(1);
  });
});

describe("computeSearchScore", () => {
  it("scores title match at 100", () => {
    const content = "# Authentication Module\n## Reasoning\nSomething else";
    const { score, matchedSections } = computeSearchScore(content, "authentication");
    expect(score).toBe(100);
    expect(matchedSections).toContain("title");
  });

  it("scores prompt section at 50", () => {
    const content = "# Other\n## Prompt\nImplement authentication";
    const { score, matchedSections } = computeSearchScore(content, "authentication");
    expect(score).toBe(50);
    expect(matchedSections).toContain("prompt");
  });

  it("scores reasoning section at 30", () => {
    const content = "# Other\n## Reasoning\nChose authentication approach";
    const { score, matchedSections } = computeSearchScore(content, "authentication");
    expect(score).toBe(30);
    expect(matchedSections).toContain("reasoning");
  });

  it("scores 'what was done' section at 30", () => {
    const content = "# Other\n## What Was Done\nAdded authentication";
    const { score, matchedSections } = computeSearchScore(content, "authentication");
    expect(score).toBe(30);
    expect(matchedSections).toContain("what was done");
  });

  it("scores files section at 20", () => {
    const content = "# Other\n## Files\nsrc/auth/middleware.ts";
    const { score, matchedSections } = computeSearchScore(content, "auth");
    expect(score).toBe(20);
    expect(matchedSections).toContain("files");
  });

  it("gives fallback score of 10 for general content match", () => {
    const content = "# Other\n## Unrelated Section\nauth code here";
    const { score, matchedSections } = computeSearchScore(content, "auth");
    expect(score).toBe(10);
    expect(matchedSections).toContain("content");
  });

  it("accumulates scores from multiple sections", () => {
    const content = "# Auth System\n## Reasoning\nChose auth approach\n## Files\nsrc/auth/main.ts";
    const { score } = computeSearchScore(content, "auth");
    // title=100 + reasoning=30 + files=20 = 150
    expect(score).toBe(150);
  });

  it("is case-insensitive", () => {
    const content = "# JWT Authentication\n## Reasoning\nSomething";
    const { score } = computeSearchScore(content, "jwt authentication");
    expect(score).toBe(100);
  });
});

describe("searchChanges", () => {
  it("returns empty array for empty query", () => {
    const tmp = makeTmp();
    expect(searchChanges(tmp, "")).toEqual([]);
  });

  it("returns empty array when .gitwhy/changes/ does not exist", () => {
    const tmp = makeTmp();
    expect(searchChanges(tmp, "auth")).toEqual([]);
  });

  it("finds matching ctx_*.md files", () => {
    const tmp = makeTmp();
    const changeDir = join(tmp, ".gitwhy", "changes", "add-auth");
    mkdirSync(changeDir, { recursive: true });
    writeFileSync(
      join(changeDir, "ctx_abc12345.md"),
      "# Auth Implementation\n## Reasoning\nChose JWT for authentication\n## Files\nsrc/auth.ts",
    );

    const results = searchChanges(tmp, "auth");
    expect(results).toHaveLength(1);
    expect(results[0].change_name).toBe("add-auth");
    expect(results[0].id).toBe("ctx_abc12345");
    expect(results[0].score).toBeGreaterThanOrEqual(100);
  });

  it("also searches intent.md and design.md", () => {
    const tmp = makeTmp();
    const changeDir = join(tmp, ".gitwhy", "changes", "add-logging");
    mkdirSync(changeDir, { recursive: true });
    writeFileSync(join(changeDir, "intent.md"), "# Intent: add-logging\n## Why This Change Exists\nNeed auth logging");

    const results = searchChanges(tmp, "auth");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("intent");
  });

  it("sorts by score descending", () => {
    const tmp = makeTmp();
    const changeDir = join(tmp, ".gitwhy", "changes", "multi-match");
    mkdirSync(changeDir, { recursive: true });
    // High score: title match (100)
    writeFileSync(join(changeDir, "ctx_high.md"), "# Auth System\nSome content");
    // Low score: content match only (10)
    writeFileSync(join(changeDir, "intent.md"), "# Intent\n## Other\nmentions auth here");

    const results = searchChanges(tmp, "auth");
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
  });

  it("respects limit option", () => {
    const tmp = makeTmp();
    const changeDir = join(tmp, ".gitwhy", "changes", "many-files");
    mkdirSync(changeDir, { recursive: true });
    for (let i = 0; i < 5; i++) {
      writeFileSync(join(changeDir, `ctx_file${i}.md`), `# Auth file ${i}\nContent about auth`);
    }

    const results = searchChanges(tmp, "auth", { limit: 3 });
    expect(results).toHaveLength(3);
  });

  it("filters by domain when specified", () => {
    const tmp = makeTmp();

    // Create a change with auth-related files
    const authDir = join(tmp, ".gitwhy", "changes", "auth-change");
    mkdirSync(authDir, { recursive: true });
    writeFileSync(
      join(authDir, "ctx_auth.md"),
      "# Auth Work\n## Files\nsrc/auth/login.ts — new — Login page",
    );

    // Create a change with frontend files
    const feDir = join(tmp, ".gitwhy", "changes", "frontend-change");
    mkdirSync(feDir, { recursive: true });
    writeFileSync(
      join(feDir, "ctx_fe.md"),
      "# Auth UI\n## Files\ncomponents/AuthForm.tsx — new — Auth form",
    );

    const results = searchChanges(tmp, "auth", { domain: "authentication" });
    expect(results.every((r) => r.domain === "authentication")).toBe(true);
  });

  it("returns no results when query does not match", () => {
    const tmp = makeTmp();
    const changeDir = join(tmp, ".gitwhy", "changes", "some-change");
    mkdirSync(changeDir, { recursive: true });
    writeFileSync(join(changeDir, "intent.md"), "# Intent: some-change\nContent about databases");

    const results = searchChanges(tmp, "zzznomatchzzz");
    expect(results).toHaveLength(0);
  });
});
