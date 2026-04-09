/**
 * whyspec plan — Create a change plan with intent, design, and tasks.
 *
 * --json mode: returns templates + context/rules for agent consumption (no files created).
 * Non-JSON mode: creates .gitwhy/changes/<name>/ with 3 template files.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { slugify } from "../utils/slugify.js";
import { readConfig } from "../core/config.js";
import {
  intentTemplate,
  designTemplate,
  tasksTemplate,
} from "../core/templates.js";

export interface PlanJsonOutput {
  path: string;
  templates: {
    intent: string;
    design: string;
    tasks: string;
  };
  context: string;
  rules: string;
}

export async function planCommand(
  name: string,
  options: { json?: boolean },
): Promise<void> {
  const slug = slugify(name);
  const gitwhyDir = join(process.cwd(), ".gitwhy");
  const changePath = join(gitwhyDir, "changes", slug);

  // Duplicate detection
  if (existsSync(changePath)) {
    throw new Error(
      `Change "${slug}" already exists at ${changePath}`,
    );
  }

  const config = readConfig(process.cwd());

  if (options.json) {
    // JSON mode: return structured data, don't create files
    const output: PlanJsonOutput = {
      path: `.gitwhy/changes/${slug}`,
      templates: {
        intent: intentTemplate(slug),
        design: designTemplate(slug),
        tasks: tasksTemplate(slug),
      },
      context: config.context ?? "",
      rules: config.rules ?? "",
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // Non-JSON mode: create directory and files
  mkdirSync(changePath, { recursive: true });
  // Write start anchor for commit tracking (used by capture to scope commits)
  writeFileSync(join(changePath, ".started"), new Date().toISOString());
  writeFileSync(join(changePath, "intent.md"), intentTemplate(slug));
  writeFileSync(join(changePath, "design.md"), designTemplate(slug));
  writeFileSync(join(changePath, "tasks.md"), tasksTemplate(slug));

  // Count decisions to make from the templates
  const intentContent = intentTemplate(slug);
  const designContent = designTemplate(slug);
  const decisionCount = (intentContent.match(/^- \[ \]/gm) || []).length +
    (designContent.match(/^- \[ \]/gm) || []).length;

  console.log(chalk.green(`\n  Created`) + ` .gitwhy/changes/${slug}/`);
  console.log(`     ${chalk.green("✓")} intent.md  — why this change exists`);
  console.log(`     ${chalk.green("✓")} design.md  — approach + decisions to make`);
  console.log(`     ${chalk.green("✓")} tasks.md   — verification-first checklist`);
  console.log(`     Decision Bridge: ${decisionCount} open questions to resolve.`);
  console.log();
}
