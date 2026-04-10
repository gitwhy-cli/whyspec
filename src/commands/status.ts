/**
 * whyspec status — Get detailed status for a change.
 *
 * --json mode: returns file presence, task progress, commits, Decision Bridge state.
 * Non-JSON mode: rich formatted status card.
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { resolveChange } from "../utils/changes.js";
import { readMarkdown } from "../core/storage.js";
import { extractDecisions, getChangeFolderCreatedAt } from "../core/context.js";
import { storageDirPath } from "../core/storage-root.js";
import { getCommitsSince } from "../utils/git.js";
import { parseTasks } from "./execute.js";

export interface StatusJsonOutput {
  name: string;
  files: {
    intent: boolean;
    design: boolean;
    tasks: boolean;
    contexts: string[];
    debug: boolean;
  };
  progress: { completed: number; total: number };
  commits: number;
  decision_bridge: { to_make: number; made: number };
}

/**
 * Extract decisions from context file <decisions> tags.
 */
function extractContextDecisionCount(ctxContent: string): number {
  const match = ctxContent.match(/<decisions>([\s\S]*?)<\/decisions>/);
  if (!match) return 0;
  return match[1]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- ")).length;
}

export async function statusCommand(
  name: string,
  options: { json?: boolean },
): Promise<void> {
  const gitwhyDir = storageDirPath(process.cwd());
  const change = resolveChange(gitwhyDir, name);

  // Check file presence.
  const hasIntent = existsSync(join(change.path, "intent.md"));
  const hasDesign = existsSync(join(change.path, "design.md"));
  const hasTasks = existsSync(join(change.path, "tasks.md"));
  const hasDebug = existsSync(join(change.path, "debug.md"));

  // Find ctx_*.md files.
  const ctxFiles = existsSync(change.path)
    ? readdirSync(change.path)
        .filter((f) => f.startsWith("ctx_") && f.endsWith(".md"))
        .sort()
    : [];

  // Parse task progress.
  const tasksContent = readMarkdown(change.path, "tasks.md");
  const { progress } = parseTasks(tasksContent ?? "");

  // Count commits since creation.
  let commitCount = 0;
  try {
    const createdAt = getChangeFolderCreatedAt(change.path);
    const commits = getCommitsSince(createdAt);
    commitCount = commits.length;
  } catch {
    // Gracefully handle if git operations fail.
  }

  // Decision Bridge state.
  const designContent = readMarkdown(change.path, "design.md") ?? "";
  const intentContent = readMarkdown(change.path, "intent.md") ?? "";
  const plannedDecisions = [
    ...new Set([...extractDecisions(designContent), ...extractDecisions(intentContent)]),
  ];

  let madeDecisions = 0;
  for (const ctxFile of ctxFiles) {
    const ctxContent = readMarkdown(change.path, ctxFile) ?? "";
    madeDecisions += extractContextDecisionCount(ctxContent);
  }

  if (options.json) {
    const output: StatusJsonOutput = {
      name: change.name,
      files: {
        intent: hasIntent,
        design: hasDesign,
        tasks: hasTasks,
        contexts: ctxFiles.map((f) => f.replace(/\.md$/, "")),
        debug: hasDebug,
      },
      progress: { completed: progress.completed, total: progress.total },
      commits: commitCount,
      decision_bridge: { to_make: plannedDecisions.length, made: madeDecisions },
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // Non-JSON mode: rich status card.
  console.log(chalk.bold.underline(`Status: ${change.name}`));
  console.log();

  // Files.
  const check = (present: boolean) => (present ? chalk.green("✓") : chalk.red("✗"));
  console.log(chalk.bold("Files:"));
  console.log(`  ${check(hasIntent)} intent.md`);
  console.log(`  ${check(hasDesign)} design.md`);
  console.log(`  ${check(hasTasks)} tasks.md`);
  console.log(`  ${check(hasDebug)} debug.md`);
  if (ctxFiles.length > 0) {
    for (const f of ctxFiles) {
      console.log(`  ${chalk.green("✓")} ${f}`);
    }
  } else {
    console.log(`  ${chalk.dim("○")} no context files yet`);
  }
  console.log();

  // Progress.
  if (progress.total > 0) {
    const pct = Math.round((progress.completed / progress.total) * 100);
    const barLen = 30;
    const filled = Math.round((pct / 100) * barLen);
    const bar = chalk.green("█".repeat(filled)) + chalk.dim("░".repeat(barLen - filled));
    console.log(chalk.bold("Tasks:"));
    console.log(`  ${bar} ${pct}% (${progress.completed}/${progress.total})`);
  } else {
    console.log(chalk.bold("Tasks:") + chalk.dim(" none defined"));
  }
  console.log();

  // Commits.
  console.log(chalk.bold("Commits:") + ` ${commitCount} since creation`);
  console.log();

  // Decision Bridge.
  console.log(chalk.bold("Decision Bridge:"));
  console.log(`  ${chalk.dim("To make:")} ${plannedDecisions.length}`);
  console.log(`  ${chalk.dim("Made:")}    ${madeDecisions}`);
  if (plannedDecisions.length > 0 && madeDecisions === 0) {
    console.log(chalk.yellow("  → Run `whyspec capture` to record decisions"));
  }
}
