/**
 * whyspec debug — Create a structured debug session (scientific method).
 *
 * --json mode: returns path, template, and related past contexts.
 * Non-JSON mode: creates debug.md, prints related contexts and next steps.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { slugify } from "../utils/slugify.js";
import { debugTemplate } from "../core/templates.js";
import { searchChanges, type SearchResult } from "../core/search.js";
import { ensureGitwhyDir } from "../core/ensure-gitwhy-dir.js";

export interface DebugJsonOutput {
  path: string;
  template: string;
  related_contexts: SearchResult[];
}

export async function debugCommand(
  name: string | undefined,
  options: { json?: boolean },
): Promise<void> {
  if (!name) {
    throw new Error("Bug description is required. Usage: whyspec debug \"description of the bug\"");
  }

  const repoRoot = process.cwd();
  const slug = slugify(name);
  const gitwhyDir = join(repoRoot, ".gitwhy");
  const changePath = join(gitwhyDir, "changes", slug);

  ensureGitwhyDir(repoRoot);

  // Quick search for related contexts using first few words of the bug name.
  const searchQuery = name.split(/\s+/).slice(0, 3).join(" ");
  let relatedContexts: SearchResult[] = [];
  try {
    relatedContexts = searchChanges(repoRoot, searchQuery, { limit: 5 });
  } catch {
    // Gracefully continue if search fails (e.g., no .gitwhy/ dir yet).
  }

  // Generate debug template.
  const template = debugTemplate(name);

  // Append related contexts section if any were found.
  let fullTemplate = template;
  if (relatedContexts.length > 0) {
    fullTemplate += "\n## Related Contexts\n";
    fullTemplate += "<!-- Past decisions and reasoning in this area -->\n";
    for (const ctx of relatedContexts) {
      fullTemplate += `- **${ctx.change_name}/${ctx.id}** (score: ${ctx.score}) — ${ctx.title}\n`;
      fullTemplate += `  ${ctx.snippet}\n`;
    }
  }

  if (options.json) {
    mkdirSync(changePath, { recursive: true });
    writeFileSync(join(changePath, ".started"), new Date().toISOString());
    writeFileSync(join(changePath, "debug.md"), fullTemplate);

    const output: DebugJsonOutput = {
      path: `.gitwhy/changes/${slug}`,
      template: fullTemplate,
      related_contexts: relatedContexts,
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // Non-JSON mode: create directory and file.
  mkdirSync(changePath, { recursive: true });
  writeFileSync(join(changePath, ".started"), new Date().toISOString());
  writeFileSync(join(changePath, "debug.md"), fullTemplate);

  console.log(chalk.green(`\n  Created`) + ` .gitwhy/changes/${slug}/`);
  console.log(`     ${chalk.green("✓")} debug.md — scientific investigation template`);

  if (relatedContexts.length > 0) {
    console.log(`\n  Related past contexts:`);
    for (const ctx of relatedContexts) {
      const scoreColor = ctx.score >= 100 ? chalk.green : ctx.score >= 30 ? chalk.yellow : chalk.dim;
      console.log(`     ${scoreColor("●")} ${ctx.change_name}/${ctx.id} — ${ctx.title}`);
    }
  }

  console.log(`\n  Next steps:`);
  console.log(`     1. Fill in Symptoms (expected vs actual)`);
  console.log(`     2. Form 3+ Hypotheses with disproof criteria`);
  console.log(`     3. Investigate each hypothesis with evidence`);
  console.log(`     4. Verify Root Cause before fixing (Iron Law)`);
  console.log(`     5. Run whyspec capture to save reasoning`);
  console.log();
}
