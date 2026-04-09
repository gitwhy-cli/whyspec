/**
 * Git utility functions for WhySpec.
 * Wraps git CLI commands via execFileSync (no shell — safe from injection).
 *
 * Reference: GitWhy Go cmd/git-why/enable.go:512 (findRepoRoot)
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface Commit {
  hash: string;
  message: string;
}

/** Returns the git repository root directory. Throws if not in a git repo. */
export function findRepoRoot(): string {
  try {
    const out = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return out.trim();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Not a git repository: ${msg}`, { cause: err });
  }
}

/** Returns the current branch name. */
export function getCurrentBranch(): string {
  const out = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  return out.trim();
}

/** Returns recent commits as { hash, message } pairs. */
export function getRecentCommits(count = 10): Commit[] {
  const out = execFileSync(
    "git",
    ["log", `--oneline`, `-${count}`],
    { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
  );

  return out
    .trim()
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => {
      const spaceIdx = line.indexOf(" ");
      if (spaceIdx === -1) return { hash: line, message: "" };
      return {
        hash: line.slice(0, spaceIdx),
        message: line.slice(spaceIdx + 1),
      };
    });
}

/** Returns commit SHAs since a given date. Used by capture to find commits since change creation. */
export function getCommitsSince(since: Date): string[] {
  try {
    const out = execFileSync(
      "git",
      ["log", `--since=${since.toISOString()}`, "--format=%H", "--max-count=100"],
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );
    return out.trim().split("\n").filter((l) => l.length > 0);
  } catch {
    return [];
  }
}

/** Returns files changed since a given date. Used by capture to detect changed files. */
export function getFilesChanged(since: Date): string[] {
  try {
    const out = execFileSync(
      "git",
      ["log", `--since=${since.toISOString()}`, "--format=", "--name-only", "--max-count=100"],
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );
    return [...new Set(out.trim().split("\n").filter((l) => l.length > 0))];
  } catch {
    return [];
  }
}

/**
 * Adds an entry to .gitignore if not already present.
 * Creates .gitignore if it doesn't exist.
 */
export function addToGitignore(repoRoot: string, entry: string): void {
  const gitignorePath = join(repoRoot, ".gitignore");

  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, "utf-8");
    const lines = content.split("\n");
    if (lines.some((line) => line.trim() === entry.trim())) {
      return; // Already present
    }
    const suffix = content.endsWith("\n") ? "" : "\n";
    writeFileSync(gitignorePath, content + suffix + entry + "\n", "utf-8");
  } else {
    writeFileSync(gitignorePath, entry + "\n", "utf-8");
  }
}
