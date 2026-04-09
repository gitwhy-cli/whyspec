import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import YAML from "yaml";
import { renderWelcomeScreen, renderTelemetryNotice, renderSuccessMessage } from "../ui/welcome.js";
import { promptToolPicker, needsAgentsMd } from "../ui/tool-picker.js";
import { readConfig } from "../core/config.js";
import { generateClaudeCodeSkills } from "../adapters/claude-code.js";
import { generateCursorCommands } from "../adapters/cursor.js";
import { generateAgentsMd as generateAgentsMdAdapter } from "../adapters/agents-md.js";
import type { GeneratedFile } from "../adapters/types.js";

// ── Types ────────────────────────────────────────────────────────────

export interface ConfigOptions {
  projectName: string;
  projectDescription: string;
  tools: string[];
  telemetry: boolean;
}

// ── Filesystem helpers (testable, accept root) ───────────────────────

export function createGitwhyDir(root: string): void {
  const gitwhyDir = path.join(root, ".gitwhy");
  const changesDir = path.join(gitwhyDir, "changes");
  const archiveDir = path.join(gitwhyDir, "archive");
  const debugDir = path.join(gitwhyDir, "debug");
  fs.mkdirSync(changesDir, { recursive: true });
  fs.mkdirSync(archiveDir, { recursive: true });
  fs.mkdirSync(debugDir, { recursive: true });
}

export function writeConfigYaml(root: string, opts: ConfigOptions): void {
  const config = {
    version: "1.0",
    project: {
      name: opts.projectName,
      description: opts.projectDescription || "",
    },
    context:
      "# Describe your tech stack and conventions here\n" +
      "# Example: Next.js 15, Supabase, TypeScript strict mode\n",
    rules:
      "# Add project-specific rules for AI agents here\n" +
      "# Example: Always use server components by default\n",
    telemetry: opts.telemetry,
    tools: opts.tools,
  };

  const yamlStr = YAML.stringify(config, {
    lineWidth: 0,
    blockQuote: "literal",
  });

  const header = "# WhySpec project configuration\n";
  fs.writeFileSync(path.join(root, ".gitwhy", "config.yaml"), header + yamlStr, "utf-8");
}

export function addToGitignore(root: string): void {
  const gitignorePath = path.join(root, ".gitignore");
  const entry = ".gitwhy/";

  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, "utf-8");
    // Check if already present (exact line match)
    const lines = content.split("\n");
    if (lines.some((line) => line.trim() === entry)) {
      return; // Already present
    }
    // Append with newline safety
    const separator = content.endsWith("\n") ? "" : "\n";
    fs.writeFileSync(gitignorePath, content + separator + entry + "\n", "utf-8");
  } else {
    fs.writeFileSync(gitignorePath, entry + "\n", "utf-8");
  }
}

const WHYSPEC_COMMANDS = ["plan", "execute", "capture", "show", "search", "debug"] as const;

/** Write GeneratedFile[] to disk, creating directories as needed. */
function writeGeneratedFiles(root: string, files: GeneratedFile[]): void {
  for (const file of files) {
    const fullPath = path.join(root, file.path);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, file.content, "utf-8");
  }
}

/**
 * Install authored skill files from skills/ directory if they exist (Agent 5's work).
 * Falls back to adapter-generated placeholders if authored files aren't available.
 */
function installAuthoredSkills(root: string, skillsSourceDir: string): boolean {
  if (!fs.existsSync(skillsSourceDir)) return false;
  let installed = false;
  for (const cmd of WHYSPEC_COMMANDS) {
    const src = path.join(skillsSourceDir, `whyspec-${cmd}`, "SKILL.md");
    if (fs.existsSync(src)) {
      const dest = path.join(root, ".claude", "skills", `whyspec-${cmd}`);
      fs.mkdirSync(dest, { recursive: true });
      fs.copyFileSync(src, path.join(dest, "SKILL.md"));
      installed = true;
    }
  }
  return installed;
}

export function installSkillFiles(root: string, tools: string[]): void {
  // Claude Code skills
  if (tools.includes("claude-code")) {
    // Try authored skill files first (production-quality from skills/ directory)
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const skillsDir = path.join(path.dirname(path.dirname(currentDir)), "skills");
    const authoredInstalled = installAuthoredSkills(root, skillsDir);
    if (!authoredInstalled) {
      // Fall back to adapter-generated placeholders
      writeGeneratedFiles(root, generateClaudeCodeSkills());
    }
  }

  // Cursor commands
  if (tools.includes("cursor")) {
    writeGeneratedFiles(root, generateCursorCommands());
  }
}

export function generateAgentsMd(root: string, tools: string[]): void {
  if (!needsAgentsMd(tools)) return;
  const files = generateAgentsMdAdapter();
  writeGeneratedFiles(root, files);
}

// ── Project detection ────────────────────────────────────────────────

export function detectProjectName(root: string): string {
  const pkgPath = path.join(root, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (typeof pkg.name === "string" && pkg.name) {
        // Strip npm scope prefix
        return pkg.name.replace(/^@[^/]+\//, "");
      }
    } catch {
      // Fall through to directory name
    }
  }
  return path.basename(root);
}

// ── Main init command ────────────────────────────────────────────────

export async function runInit(): Promise<void> {
  const root = process.cwd();
  const gitwhyDir = path.join(root, ".gitwhy");

  // Guard: must be in a project directory (git repo or has package.json/similar)
  const isProject =
    fs.existsSync(path.join(root, ".git")) ||
    fs.existsSync(path.join(root, "package.json")) ||
    fs.existsSync(path.join(root, "pyproject.toml")) ||
    fs.existsSync(path.join(root, "Cargo.toml")) ||
    fs.existsSync(path.join(root, "go.mod"));

  if (!isProject) {
    console.log(chalk.red("\n  Not a project directory."));
    console.log(chalk.dim("  Run whyspec init inside a project (git repo, package.json, etc.).\n"));
    process.exitCode = 1;
    return;
  }

  // Guard: already initialized — but repair missing skills from partial init
  if (fs.existsSync(gitwhyDir)) {
    const config = readConfig(root);
    const tools = config.tools ?? ["claude-code"];
    let repaired = false;

    // Check if skills need to be installed (e.g. prior crash before skill step)
    if (tools.includes("claude-code")) {
      const skillCheck = path.join(root, ".claude", "skills", "whyspec-plan", "SKILL.md");
      if (!fs.existsSync(skillCheck)) {
        console.log(chalk.yellow("\n  Repairing missing skill files...\n"));
        installSkillFiles(root, tools);
        generateAgentsMd(root, tools);
        repaired = true;
      }
    }

    if (repaired) {
      console.log(chalk.green.bold("  \u2713 Skills installed successfully!"));
      console.log(`\n  Try: ${chalk.cyan.bold("/whyspec:plan")}\n`);
    } else {
      console.log(chalk.yellow("\n  WhySpec is already initialized in this directory."));
      console.log(chalk.dim("  .gitwhy/ already exists.\n"));
    }
    return;
  }

  // 1. Telemetry notice
  console.log(renderTelemetryNotice());

  // 2. Welcome screen (includes logo, folder preview, quick start)
  console.log(renderWelcomeScreen());

  // 3. Tool picker
  console.log(chalk.dim("  Press Enter to select tools...\n"));
  const selectedTools = await promptToolPicker();

  if (selectedTools.length === 0) {
    console.log(chalk.yellow("  No tools selected. Using defaults (claude-code).\n"));
    selectedTools.push("claude-code");
  }

  // 4. Create .gitwhy/ structure
  createGitwhyDir(root);

  // 5. Write config.yaml
  const projectName = detectProjectName(root);
  writeConfigYaml(root, {
    projectName,
    projectDescription: "",
    tools: selectedTools,
    telemetry: process.env.WHYSPEC_TELEMETRY !== "0",
  });

  // 6. Add to .gitignore
  addToGitignore(root);

  // 7. Install skill files
  installSkillFiles(root, selectedTools);

  // 8. Generate AGENTS.md
  generateAgentsMd(root, selectedTools);

  // 9. Success message
  console.log(renderSuccessMessage(selectedTools));
}
