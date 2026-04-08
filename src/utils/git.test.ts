import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  findRepoRoot,
  getCurrentBranch,
  getRecentCommits,
  addToGitignore,
} from "./git.js";

describe("findRepoRoot", () => {
  it("returns a valid absolute path in a git repo", () => {
    const root = findRepoRoot();
    expect(root).toBeTruthy();
    expect(root.startsWith("/")).toBe(true);
  });
});

describe("getCurrentBranch", () => {
  it("returns a non-empty branch name", () => {
    const branch = getCurrentBranch();
    expect(branch).toBeTruthy();
    expect(typeof branch).toBe("string");
  });
});

describe("getRecentCommits", () => {
  it("returns an array of commits", () => {
    const commits = getRecentCommits(5);
    expect(Array.isArray(commits)).toBe(true);
    if (commits.length > 0) {
      expect(commits[0]).toHaveProperty("hash");
      expect(commits[0]).toHaveProperty("message");
    }
  });

  it("respects the count parameter", () => {
    const commits = getRecentCommits(1);
    expect(commits.length).toBeLessThanOrEqual(1);
  });
});

describe("addToGitignore", () => {
  it("creates .gitignore if it does not exist", () => {
    const tmp = mkdtempSync(join(tmpdir(), "whyspec-git-test-"));
    addToGitignore(tmp, ".gitwhy/");
    const content = readFileSync(join(tmp, ".gitignore"), "utf-8");
    expect(content).toBe(".gitwhy/\n");
  });

  it("appends entry to existing .gitignore", () => {
    const tmp = mkdtempSync(join(tmpdir(), "whyspec-git-test-"));
    writeFileSync(join(tmp, ".gitignore"), "node_modules/\n", "utf-8");
    addToGitignore(tmp, ".gitwhy/");
    const content = readFileSync(join(tmp, ".gitignore"), "utf-8");
    expect(content).toBe("node_modules/\n.gitwhy/\n");
  });

  it("does not duplicate existing entries", () => {
    const tmp = mkdtempSync(join(tmpdir(), "whyspec-git-test-"));
    writeFileSync(join(tmp, ".gitignore"), ".gitwhy/\n", "utf-8");
    addToGitignore(tmp, ".gitwhy/");
    const content = readFileSync(join(tmp, ".gitignore"), "utf-8");
    expect(content).toBe(".gitwhy/\n");
  });
});
