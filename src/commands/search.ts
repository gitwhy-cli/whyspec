/**
 * whyspec search — Search past decisions and reasoning across all changes.
 *
 * --json mode: returns scored results array.
 * Non-JSON mode: formatted output with color-coded scores and snippets.
 */

import chalk from "chalk";
import { searchChanges } from "../core/search.js";

export async function searchCommand(
  query: string,
  options: { json?: boolean; domain?: string; limit?: number },
): Promise<void> {
  const repoRoot = process.cwd();
  const parsed = Number.parseInt(String(options.limit ?? ""), 10);
  const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : 10;

  const results = searchChanges(repoRoot, query, {
    domain: options.domain,
    limit,
  });

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  if (results.length === 0) {
    console.log(chalk.yellow(`\n  No results found for "${query}"\n`));
    return;
  }

  console.log(chalk.green(`\n  Found ${results.length} matches`) + ` for "${query}":\n`);

  for (const r of results) {
    const scoreColor = r.score >= 100 ? chalk.green : r.score >= 30 ? chalk.yellow : chalk.dim;
    const icon = r.score >= 100 ? chalk.green("●") : r.score >= 30 ? chalk.yellow("●") : chalk.dim("○");

    console.log(`     ${icon} ${chalk.bold(r.change_name)} / ${r.title} ${scoreColor(`[${r.score}]`)}`);
    console.log(`       ${chalk.dim(r.snippet)}`);
  }
  console.log();
}
