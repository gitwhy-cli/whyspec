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
 * Parse tasks.md for checkbox items, scoped to the ## Tasks section only.
 * Ignores checkboxes in ## Verification and other sections.
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
  let inTasksSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Enter the ## Tasks section
    if (/^##\s+Tasks\b/i.test(line)) {
      inTasksSection = true;
      continue;
    }
    // Exit on any other ## heading
    if (inTasksSection && /^##\s/.test(line)) {
      break;
    }
    // Only count checkboxes within ## Tasks
    if (!inTasksSection) continue;

    // Match completed tasks: - [x] or - [X]
    if (/^-\s+\[[xX]\]\s+/.test(line)) {
      total++;
      completed++;
      continue;
    }

    // Match pending tasks: - [ ] with description
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

  // Non-JSON mode: display task list with checkmarks
  console.log(chalk.green("\n  Executing:") + ` ${change.name}`);

  if (progress.total === 0) {
    console.log(chalk.yellow("     No tasks defined in tasks.md yet."));
    console.log();
    return;
  }

  // Show all tasks (completed + pending) with numbers
  const lines = tasksContent.split("\n");
  let inTasksSection = false;
  let taskNum = 0;
  for (const line of lines) {
    if (/^##\s+Tasks\b/i.test(line)) { inTasksSection = true; continue; }
    if (inTasksSection && /^##\s/.test(line)) break;
    if (!inTasksSection) continue;

    if (/^-\s+\[[xX]\]\s+/.test(line)) {
      taskNum++;
      const desc = line.replace(/^-\s+\[[xX]\]\s+/, "").trim();
      console.log(`     ${chalk.green("✓")} ${taskNum}. ${desc}`);
    } else if (/^-\s+\[ \]\s+/.test(line)) {
      taskNum++;
      const desc = line.replace(/^-\s+\[ \]\s+/, "").trim();
      console.log(`     ${chalk.dim("○")} ${taskNum}. ${desc}`);
    }
  }

  if (progress.remaining === 0) {
    console.log(chalk.green(`     All tasks complete!`));
  } else {
    console.log(chalk.dim(`     ${progress.completed}/${progress.total} tasks complete`));
  }
  console.log();
}
