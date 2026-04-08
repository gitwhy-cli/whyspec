/**
 * Git helpers — uses execFileSync (not exec) to prevent shell injection.
 */

import { execFileSync } from "node:child_process";

export function getCurrentBranch(): string {
  try {
    return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      encoding: "utf-8",
    }).trim();
  } catch {
    return "unknown";
  }
}

export function getCommitsSince(sinceDate: Date): string[] {
  try {
    const output = execFileSync(
      "git",
      [
        "log",
        `--since=${sinceDate.toISOString()}`,
        "--format=%H",
        "--max-count=100",
      ],
      { encoding: "utf-8" },
    ).trim();
    if (!output) return [];
    return output.split("\n");
  } catch {
    return [];
  }
}

export function getFilesChanged(sinceDate: Date): string[] {
  try {
    const output = execFileSync(
      "git",
      [
        "log",
        `--since=${sinceDate.toISOString()}`,
        "--name-only",
        "--format=",
        "--max-count=100",
      ],
      { encoding: "utf-8" },
    ).trim();
    if (!output) return [];
    // Deduplicate file paths
    return [...new Set(output.split("\n").filter(Boolean))];
  } catch {
    return [];
  }
}
