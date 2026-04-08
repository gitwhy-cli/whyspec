/**
 * whyspec execute — Get execution context and track progress for a change.
 *
 * --json mode: returns plan file contents + task progress for agent consumption.
 * Non-JSON mode: displays progress summary with task list.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { resolveChange } from "../utils/changes.js";

export interface PendingTask {
  line: number;
  description: string;
}

export interface TaskProgress {
  total: number;
  completed: number;
  remaining: number;
}

export interface ExecuteJsonOutput {
  change_name: string;
  intent_content: string;
  design_content: string;
  tasks_content: string;
  progress: TaskProgress;
  pending_tasks: PendingTask[];
}

function readFileOrEmpty(filePath: string): string {
  if (!existsSync(filePath)) return "";
  return readFileSync(filePath, "utf-8");
}

/**
 * Parse tasks.md for checkbox items.
 * Recognizes: - [x], - [X] (completed) and - [ ] (pending).
 */
export function parseTasks(content: string): {
  progress: TaskProgress;
  pending: PendingTask[];
} {
  if (!content.trim()) {
    return { progress: { total: 0, completed: 0, remaining: 0 }, pending: [] };
  }

  const lines = content.split("\n");
  let total = 0;
  let completed = 0;
  const pending: PendingTask[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match completed tasks: - [x] or - [X]
    if (/^-\s+\[[xX]\]\s+/.test(line)) {
      total++;
      completed++;
      continue;
    }

    // Match pending tasks: - [ ]
    const pendingMatch = line.match(/^-\s+\[ \]\s+(.+)/);
    if (pendingMatch) {
      total++;
      pending.push({
        line: i + 1, // 1-indexed line number
        description: pendingMatch[1].trim(),
      });
    }
  }

  return {
    progress: { total, completed, remaining: total - completed },
    pending,
  };
}

export async function executeCommand(
  name: string | undefined,
  options: { json?: boolean },
): Promise<void> {
  const gitwhyDir = join(process.cwd(), ".gitwhy");
  const change = resolveChange(gitwhyDir, name);

  // Read all three planning artifacts
  const intentContent = readFileOrEmpty(join(change.path, "intent.md"));
  const designContent = readFileOrEmpty(join(change.path, "design.md"));
  const tasksContent = readFileOrEmpty(join(change.path, "tasks.md"));

  // Parse task progress
  const { progress, pending } = parseTasks(tasksContent);

  if (options.json) {
    const output: ExecuteJsonOutput = {
      change_name: change.name,
      intent_content: intentContent,
      design_content: designContent,
      tasks_content: tasksContent,
      progress,
      pending_tasks: pending,
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // Non-JSON mode: display progress summary
  console.log(chalk.bold(`Change: ${change.name}`));
  console.log();

  if (progress.total === 0) {
    console.log(chalk.yellow("No tasks found in tasks.md"));
    return;
  }

  // Progress bar
  const pct = Math.round((progress.completed / progress.total) * 100);
  const barLen = 30;
  const filled = Math.round((pct / 100) * barLen);
  const bar = chalk.green("█".repeat(filled)) + chalk.dim("░".repeat(barLen - filled));
  console.log(`Progress: ${bar} ${pct}% (${progress.completed}/${progress.total})`);
  console.log();

  if (pending.length > 0) {
    console.log(chalk.bold("Pending tasks:"));
    pending.forEach((t) => {
      console.log(`  ${chalk.dim(`L${t.line}`)} - [ ] ${t.description}`);
    });
  } else {
    console.log(chalk.green("All tasks completed!"));
  }
}
