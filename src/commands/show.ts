/**
 * whyspec show — Display the full story of a change with Decision Bridge delta.
 *
 * --json mode: returns all file contents + decision bridge delta.
 * Non-JSON mode: formatted markdown output with sections and color-coded Decision Bridge.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { resolveChange } from "../utils/changes.js";
import { extractDecisions } from "../core/context.js";
import { parseTasks } from "./execute.js";

export interface ShowJsonOutput {
  change_name: string;
  intent: string;
  design: string;
  tasks: string;
  contexts: Array<{ id: string; content: string }>;
  decision_bridge_delta: {
    planned: string[];
    decided: string[];
    surprises: string[];
  };
}

/**
 * Extract decisions from a ctx_*.md context file.
 * Parses the <decisions> XML tag within <reasoning>.
 * Each line starting with "- " is a decision.
 */
function extractContextDecisions(ctxContent: string): string[] {
  const match = ctxContent.match(/<decisions>([\s\S]*?)<\/decisions>/);
  if (!match) return [];

  return match[1]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim());
}

/**
 * Detect "surprises" — decisions in context files that were NOT planned in design.md.
 * Uses case-insensitive substring matching for fuzzy comparison.
 */
function detectSurprises(planned: string[], decided: string[]): string[] {
  const lowerPlanned = planned.map((p) => p.toLowerCase());
  return decided.filter((d) => {
    const lowerD = d.toLowerCase();
    // A decision is a surprise if no planned decision contains a key overlap.
    // We check if any planned decision shares significant words with this decision.
    return !lowerPlanned.some((p) => {
      // Extract key words (>3 chars) from both.
      const dWords = lowerD.split(/\W+/).filter((w) => w.length > 3);
      return dWords.some((w) => p.includes(w));
    });
  });
}

function readFileOrEmpty(filePath: string): string {
  if (!existsSync(filePath)) return "";
  return readFileSync(filePath, "utf-8");
}

export async function showCommand(
  name: string,
  options: { json?: boolean },
): Promise<void> {
  const gitwhyDir = join(process.cwd(), ".gitwhy");
  const change = resolveChange(gitwhyDir, name);

  // Read all files.
  const intent = readFileOrEmpty(join(change.path, "intent.md"));
  const design = readFileOrEmpty(join(change.path, "design.md"));
  const tasks = readFileOrEmpty(join(change.path, "tasks.md"));

  // Find all ctx_*.md files.
  const ctxFiles = existsSync(change.path)
    ? readdirSync(change.path)
        .filter((f) => f.startsWith("ctx_") && f.endsWith(".md"))
        .sort()
    : [];

  const contexts = ctxFiles.map((f) => ({
    id: f.replace(/\.md$/, ""),
    content: readFileOrEmpty(join(change.path, f)),
  }));

  // Compute Decision Bridge delta.
  const planned = extractDecisions(design);

  // Also extract from intent.md if it has decisions.
  const intentDecisions = extractDecisions(intent);
  const allPlanned = [...new Set([...planned, ...intentDecisions])];

  // Collect all decided items from all context files.
  const allDecided: string[] = [];
  for (const ctx of contexts) {
    allDecided.push(...extractContextDecisions(ctx.content));
  }

  const surprises = detectSurprises(allPlanned, allDecided);

  if (options.json) {
    const output: ShowJsonOutput = {
      change_name: change.name,
      intent,
      design,
      tasks,
      contexts,
      decision_bridge_delta: {
        planned: allPlanned,
        decided: allDecided,
        surprises,
      },
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // Non-JSON mode: formatted output.
  console.log(chalk.bold.underline(`Change: ${change.name}`));
  console.log();

  // Intent section.
  if (intent) {
    console.log(chalk.bold.blue("── Intent ──────────────────────────────────────"));
    console.log(intent.trim());
    console.log();
  }

  // Design section.
  if (design) {
    console.log(chalk.bold.blue("── Design ──────────────────────────────────────"));
    console.log(design.trim());
    console.log();
  }

  // Tasks section.
  if (tasks) {
    const { progress } = parseTasks(tasks);
    const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
    console.log(chalk.bold.blue("── Tasks ───────────────────────────────────────"));
    console.log(`Progress: ${pct}% (${progress.completed}/${progress.total})`);
    console.log(tasks.trim());
    console.log();
  }

  // Contexts section.
  if (contexts.length > 0) {
    console.log(chalk.bold.blue("── Contexts ────────────────────────────────────"));
    for (const ctx of contexts) {
      console.log(chalk.dim(`--- ${ctx.id} ---`));
      console.log(ctx.content.trim());
      console.log();
    }
  }

  // Decision Bridge delta.
  console.log(chalk.bold.magenta("── Decision Bridge ─────────────────────────────"));

  if (allPlanned.length > 0) {
    allPlanned.forEach((d) => {
      const resolved = allDecided.some((dec) => {
        const dWords = d.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
        return dWords.some((w) => dec.toLowerCase().includes(w));
      });
      const icon = resolved ? chalk.green("✓") : chalk.dim("○");
      console.log(`  ${icon} ${d}`);
    });
  }

  if (surprises.length > 0) {
    surprises.forEach((d) => console.log(`  ${chalk.yellow("⚠")} SURPRISE: ${d}`));
  }

  if (allPlanned.length === 0 && allDecided.length === 0) {
    console.log(chalk.dim("  No decisions tracked yet."));
  }
  console.log();
}
