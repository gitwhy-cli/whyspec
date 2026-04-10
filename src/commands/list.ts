/**
 * whyspec list — List all active changes with status.
 *
 * --json mode: returns array of change summaries.
 * Non-JSON mode: formatted table with progress bars.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { listChanges } from "../utils/changes.js";
import { readMarkdown } from "../core/storage.js";
import { storageDirPath } from "../core/storage-root.js";
import { parseTasks } from "./execute.js";

export interface ChangeListItem {
  name: string;
  files_count: number;
  context_count: number;
  task_progress: { completed: number; total: number };
  last_modified: string;
}

export interface ListJsonOutput {
  changes: ChangeListItem[];
}

/**
 * Get the most recent modification time from all files in a directory.
 */
function getLastModified(dirPath: string): Date {
  let latest = new Date(0);
  if (!existsSync(dirPath)) return latest;

  const entries = readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    try {
      const stat = statSync(fullPath);
      if (stat.mtime > latest) latest = stat.mtime;
    } catch {
      // Skip files we can't stat.
    }
  }
  return latest;
}

export async function listCommand(
  options: { json?: boolean },
): Promise<void> {
  const gitwhyDir = storageDirPath(process.cwd());
  const changes = listChanges(gitwhyDir);

  if (changes.length === 0) {
    if (options.json) {
      console.log(JSON.stringify({ changes: [] }, null, 2));
    } else {
      console.log(chalk.yellow("No active changes. Run `whyspec plan <name>` to create one."));
    }
    return;
  }

  const items: ChangeListItem[] = [];

  for (const name of changes) {
    const changeDir = join(gitwhyDir, "changes", name);

    // Count known files.
    const knownFiles = ["intent.md", "design.md", "tasks.md", "debug.md"];
    let filesCount = 0;
    for (const f of knownFiles) {
      if (existsSync(join(changeDir, f))) filesCount++;
    }

    // Count ctx_*.md files.
    const ctxFiles = existsSync(changeDir)
      ? readdirSync(changeDir).filter((f) => f.startsWith("ctx_") && f.endsWith(".md"))
      : [];
    const contextCount = ctxFiles.length;
    filesCount += contextCount;

    // Parse task progress.
    const tasksContent = readMarkdown(changeDir, "tasks.md");
    const { progress } = parseTasks(tasksContent ?? "");

    const lastModified = getLastModified(changeDir);

    items.push({
      name,
      files_count: filesCount,
      context_count: contextCount,
      task_progress: { completed: progress.completed, total: progress.total },
      last_modified: lastModified.toISOString(),
    });
  }

  if (options.json) {
    console.log(JSON.stringify({ changes: items }, null, 2));
    return;
  }

  // Non-JSON mode: formatted table.
  console.log(chalk.bold("Active changes:"));
  console.log();

  for (const item of items) {
    const { completed, total } = item.task_progress;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const barLen = 15;
    const filled = Math.round((pct / 100) * barLen);
    const bar = total > 0
      ? chalk.green("█".repeat(filled)) + chalk.dim("░".repeat(barLen - filled))
      : chalk.dim("░".repeat(barLen));

    const ctxBadge = item.context_count > 0 ? chalk.cyan(` [${item.context_count} ctx]`) : "";
    const progressStr = total > 0 ? ` ${pct}% (${completed}/${total})` : "";

    console.log(`  ${chalk.bold(item.name)}${ctxBadge}`);
    console.log(`    ${bar}${progressStr}  ${chalk.dim(`${item.files_count} files`)}`);
  }
}
