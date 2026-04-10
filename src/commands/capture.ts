/**
 * whyspec capture — Capture reasoning context for a change.
 *
 * --json mode: returns XML template + commits + files + Decision Bridge data.
 * Non-JSON mode: writes ctx_<id>.md with metadata header + XML template.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { resolveChange } from "../utils/changes.js";
import { getCurrentBranch, getCommitsSince, getFilesChanged, getRemoteUrl } from "../utils/git.js";
import { ensureGitwhyDir } from "../core/ensure-gitwhy-dir.js";
import {
  generateContextId,
  renderContextXml,
  extractDecisions,
  getChangeFolderCreatedAt,
} from "../core/context.js";

export interface CaptureJsonOutput {
  template: string;
  commits: string[];
  files_changed: string[];
  decisions_to_make: string[];
  change_name: string;
  change_path: string;
}

function readFileOrEmpty(filePath: string): string {
  if (!existsSync(filePath)) return "";
  return readFileSync(filePath, "utf-8");
}

export async function captureCommand(
  name: string | undefined,
  options: { json?: boolean },
): Promise<void> {
  const repoRoot = process.cwd();
  const gitwhyDir = join(repoRoot, ".gitwhy");

  if (!options.json) {
    ensureGitwhyDir(repoRoot);
  }

  const change = resolveChange(gitwhyDir, name);

  // Read planning artifacts
  const intentContent = readFileOrEmpty(join(change.path, "intent.md"));
  const designContent = readFileOrEmpty(join(change.path, "design.md"));

  // Extract Decision Bridge data from design.md
  const decisions = extractDecisions(designContent);

  // Also extract decisions from intent.md if it has a Decisions to Make section
  const intentDecisions = extractDecisions(intentContent);
  const allDecisions = [...new Set([...decisions, ...intentDecisions])];

  // Auto-detect commits and files changed since the change folder was created
  let commits: string[] = [];
  let filesChanged: string[] = [];
  try {
    const createdAt = getChangeFolderCreatedAt(change.path);
    commits = getCommitsSince(createdAt);
    filesChanged = getFilesChanged(createdAt);
  } catch {
    // Gracefully handle if git operations fail
  }

  if (options.json) {
    const output: CaptureJsonOutput = {
      template: renderContextXml(),
      commits,
      files_changed: filesChanged,
      decisions_to_make: allDecisions,
      change_name: change.name,
      change_path: `.gitwhy/changes/${change.name}`,
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // Non-JSON mode: write ctx_<id>.md with GitWhy-compatible metadata header
  const contextId = generateContextId();
  const branch = getCurrentBranch();
  const repository = getRemoteUrl();
  const commitList = commits.length > 0 ? commits.map((c) => c.slice(0, 7)).join(", ") : "none";

  const metadataHeader = [
    `# ${change.name}`,
    "",
    `**Context ID:** ${contextId}`,
    `**Agent:** whyspec`,
    ...(repository ? [`**Repository:** ${repository}`] : []),
    `**Branch:** ${branch}`,
    `**Date:** ${new Date().toISOString()}`,
    `**Change:** ${change.name}`,
    `**Intent:** .gitwhy/changes/${change.name}/intent.md`,
    `**Commits:** ${commitList}`,
    "",
    "---",
    "",
  ].join("\n");

  const content = metadataHeader + renderContextXml() + "\n";
  const fileName = `${contextId}.md`;
  const filePath = join(change.path, fileName);
  writeFileSync(filePath, content);

  if (allDecisions.length > 0) {
    console.log(chalk.green("\n  Decision Bridge resolved:"));
    allDecisions.forEach((d) => console.log(`     ${chalk.green("✓")} ${d}`));
  }
  console.log(chalk.green(`\n  Saved to`) + ` ${contextId}.md`);
  console.log(chalk.dim(`     change: ${change.name}  branch: ${branch}  commits: ${commitList}`));
  console.log();
}
