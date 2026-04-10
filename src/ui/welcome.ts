import chalk from "chalk";
import { renderLogo } from "./ascii-logo.js";

export function renderWelcomeScreen(): string {
  const lines: string[] = [];

  lines.push("");
  lines.push(renderLogo());
  lines.push("");
  lines.push(chalk.bold("  The reasoning layer for AI coding"));
  lines.push("");
  lines.push(chalk.dim("  This will create:"));
  lines.push(chalk.white("    .gitwhy/"));
  lines.push(chalk.white("    \u251C\u2500\u2500 config.yaml"));
  lines.push(chalk.white("    \u2514\u2500\u2500 changes/"));
  lines.push("");
  lines.push(chalk.dim("  Quick start after setup:"));
  lines.push(`    ${chalk.green("whyspec-plan")}      Plan before coding`);
  lines.push(`    ${chalk.green("whyspec-execute")}   Implement with context`);
  lines.push(`    ${chalk.green("whyspec-capture")}   Save your reasoning`);
  lines.push(`    ${chalk.green("whyspec-debug")}     Debug with science`);
  lines.push("");

  return lines.join("\n");
}

export function renderTelemetryNotice(): string {
  return chalk.dim(
    "  Telemetry: anonymous usage stats (opt-out: WHYSPEC_TELEMETRY=0)"
  );
}

export function renderSuccessMessage(tools: string[]): string {
  const lines: string[] = [];
  const usesSlashCommands = tools.includes("claude-code") || tools.includes("cursor");
  const usesCodex = tools.includes("codex");
  const exampleCommand = usesSlashCommands
    ? "/whyspec-plan"
    : usesCodex
      ? "$whyspec-plan"
      : "whyspec plan";

  lines.push("");
  lines.push(chalk.green.bold("  \u2713 WhySpec initialized!"));
  lines.push("");
  lines.push(chalk.dim("  Created:"));
  lines.push(chalk.white("    .gitwhy/config.yaml"));
  lines.push(chalk.white("    .gitwhy/changes/"));
  if (tools.length > 0) {
    lines.push("");
    lines.push(chalk.dim(`  Tools configured: ${tools.join(", ")}`));
  }
  lines.push("");
  lines.push(`  Ready! Try: ${chalk.cyan.bold(exampleCommand)}`);
  lines.push("");

  return lines.join("\n");
}
