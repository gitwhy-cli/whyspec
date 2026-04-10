import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import YAML from "yaml";
import { renderWelcomeScreen, renderTelemetryNotice, renderSuccessMessage } from "../ui/welcome.js";
import { promptToolPicker, needsAgentsMd } from "../ui/tool-picker.js";
import { readConfig } from "../core/config.js";
import { generateClaudeCodeCommands } from "../adapters/claude-code.js";
import { generateCursorCommands } from "../adapters/cursor.js";
import { generateCodexSkills } from "../adapters/codex.js";
import { generateAgentsMd as generateAgentsMdAdapter } from "../adapters/agents-md.js";
import { COMMAND_ARGUMENT_HINTS, COMMAND_DESCRIPTIONS, type GeneratedFile } from "../adapters/types.js";

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

export function ensureVisibleGitwhyAlias(root: string, tools: string[]): void {
  if (!tools.includes("codex")) {
    return;
  }

  const helperPath = path.join(root, "gitwhy");
  const targetPath = path.join(root, ".gitwhy");

  if (!fs.existsSync(targetPath)) {
    return;
  }

  if (fs.existsSync(helperPath) && fs.lstatSync(helperPath).isSymbolicLink()) {
    fs.unlinkSync(helperPath);
  }

  fs.mkdirSync(helperPath, { recursive: true });

  const readmePath = path.join(helperPath, "README.md");
  if (!fs.existsSync(readmePath)) {
    fs.writeFileSync(
      readmePath,
      [
        "# WhySpec workspace",
        "",
        "This visible folder mirrors `.gitwhy/` for Codex file trees.",
        "Edit files through `gitwhy/` or `.gitwhy/` interchangeably.",
        "",
      ].join("\n"),
      "utf-8",
    );
  }

  const entries = [
    ["config.yaml", path.join(targetPath, "config.yaml"), "file"],
    ["changes", path.join(targetPath, "changes"), "dir"],
    ["archive", path.join(targetPath, "archive"), "dir"],
    ["debug", path.join(targetPath, "debug"), "dir"],
  ] as const;

  for (const [name, sourcePath, linkType] of entries) {
    const entryPath = path.join(helperPath, name);
    if (fs.existsSync(entryPath)) {
      if (fs.lstatSync(entryPath).isSymbolicLink()) {
        const currentTarget = fs.realpathSync(entryPath);
        const expectedTarget = fs.realpathSync(sourcePath);
        if (currentTarget === expectedTarget) {
          continue;
        }
        fs.unlinkSync(entryPath);
      } else {
        continue;
      }
    }

    const relativeTarget = path.relative(path.dirname(entryPath), sourcePath);
    fs.symlinkSync(
      relativeTarget,
      entryPath,
      process.platform === "win32" ? "junction" : linkType,
    );
  }
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
  const entry = ".gitwhy/";
  const gitignorePath = path.join(root, ".gitignore");
  const gitDir = path.join(root, ".git");
  const gitExcludePath = path.join(gitDir, "info", "exclude");

  // Always use .gitignore (committed, visible to all agents).
  // .git/info/exclude is local-only and some agents delete files
  // listed there on startup, causing data loss.
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, "utf-8");
    const lines = content.split("\n");
    if (!lines.some((line) => line.trim() === entry)) {
      const separator = content.endsWith("\n") ? "" : "\n";
      fs.writeFileSync(gitignorePath, content + separator + entry + "\n", "utf-8");
    }
  } else {
    fs.writeFileSync(gitignorePath, entry + "\n", "utf-8");
  }

  // Migrate: remove from .git/info/exclude if it was previously added there.
  // This prevents double-ignoring and completes the migration to .gitignore.
  if (fs.existsSync(gitExcludePath)) {
    const excludeContent = fs.readFileSync(gitExcludePath, "utf-8");
    const excludeLines = excludeContent.split("\n");
    if (excludeLines.some((line) => line.trim() === entry)) {
      const filtered = excludeLines
        .filter((line) => line.trim() !== entry);
      fs.writeFileSync(gitExcludePath, filtered.join("\n"), "utf-8");
    }
  }
}

const WHYSPEC_COMMANDS = ["plan", "execute", "capture", "show", "search", "debug"] as const;

/** Write GeneratedFile[] to disk, creating directories as needed. */
function writeGeneratedFiles(root: string, files: GeneratedFile[]): void {
  for (const file of files) {
    const fullPath = path.isAbsolute(file.path) ? file.path : path.join(root, file.path);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, file.content, "utf-8");
  }
}

function stripJsonComments(content: string): string {
  let output = "";
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < content.length; i++) {
    const current = content[i];
    const next = content[i + 1];
    const previous = content[i - 1];

    if (inLineComment) {
      if (current === "\n") {
        inLineComment = false;
        output += current;
      }
      continue;
    }

    if (inBlockComment) {
      if (current === "*" && next === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (!inString && current === "/" && next === "/") {
      inLineComment = true;
      i++;
      continue;
    }

    if (!inString && current === "/" && next === "*") {
      inBlockComment = true;
      i++;
      continue;
    }

    if (current === "\"" && previous !== "\\") {
      inString = !inString;
    }

    output += current;
  }

  return output.replace(/,\s*([}\]])/g, "$1");
}

function parseJsoncObject(content: string): Record<string, unknown> {
  const parsed = JSON.parse(stripJsonComments(content));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected a JSON object");
  }
  return parsed as Record<string, unknown>;
}

export function ensureVsCodeShowsGitwhy(root: string): void {
  const settingsPath = path.join(root, ".vscode", "settings.json");
  let settings: Record<string, unknown> = {};

  if (fs.existsSync(settingsPath)) {
    settings = parseJsoncObject(fs.readFileSync(settingsPath, "utf-8"));
  }

  const existingExcludes = settings["files.exclude"];
  const filesExclude = existingExcludes &&
      typeof existingExcludes === "object" &&
      !Array.isArray(existingExcludes)
    ? { ...(existingExcludes as Record<string, unknown>) }
    : {};

  filesExclude[".gitwhy"] = false;
  settings["files.exclude"] = filesExclude;

  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
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
      const dest = path.join(root, `whyspec-${cmd}`);
      fs.mkdirSync(dest, { recursive: true });
      fs.copyFileSync(src, path.join(dest, "SKILL.md"));
      installed = true;
    }
  }
  return installed;
}

function installClaudeCommandsFromSkills(root: string, skillsSourceDir: string): boolean {
  if (!fs.existsSync(skillsSourceDir)) return false;
  let installed = false;
  for (const cmd of WHYSPEC_COMMANDS) {
    const src = path.join(skillsSourceDir, `whyspec-${cmd}`, "SKILL.md");
    if (!fs.existsSync(src)) {
      continue;
    }

    const raw = fs.readFileSync(src, "utf-8");
    const parts = raw.split("---");
    const body = parts.length >= 3 ? parts.slice(2).join("---").trim() : raw.trim();
    const frontmatter = [
      "---",
      `description: ${COMMAND_DESCRIPTIONS[cmd]}`,
      `argument-hint: ${COMMAND_ARGUMENT_HINTS[cmd]}`,
      "---",
    ].join("\n");
    const content = `${frontmatter}\n\n${body.replaceAll("/whyspec-", "/whyspec:")}\n`;
    const dest = path.join(root, `whyspec:${cmd}.md`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content, "utf-8");
    installed = true;
  }
  return installed;
}

function removeLegacyClaudeSkills(root: string): boolean {
  const skillsRoot = path.join(root, ".claude", "skills");
  let removed = false;

  for (const cmd of WHYSPEC_COMMANDS) {
    const legacyPath = path.join(skillsRoot, `whyspec-${cmd}`);
    if (fs.existsSync(legacyPath)) {
      fs.rmSync(legacyPath, { recursive: true, force: true });
      removed = true;
    }
  }

  if (removed && fs.existsSync(skillsRoot) && fs.readdirSync(skillsRoot).length === 0) {
    fs.rmdirSync(skillsRoot);
  }

  return removed;
}

function getSkillsSourceDir(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.join(path.dirname(path.dirname(currentDir)), "skills");
}

function getCodexSkillsRoot(): string {
  return path.join(process.env.CODEX_HOME || path.join(os.homedir(), ".codex"), "skills");
}

function installCodexSkills(root: string, skillsSourceDir: string): void {
  const codexSkillsRoot = getCodexSkillsRoot();
  const authoredInstalled = installAuthoredSkills(codexSkillsRoot, skillsSourceDir);

  if (!authoredInstalled) {
    writeGeneratedFiles(root, generateCodexSkills(codexSkillsRoot));
    return;
  }

  const metadataFiles = generateCodexSkills(codexSkillsRoot)
    .filter((file) => file.path.endsWith("/agents/openai.yaml"));
  writeGeneratedFiles(root, metadataFiles);
}

export function installSkillFiles(root: string, tools: string[]): void {
  const skillsDir = getSkillsSourceDir();

  // Claude Code skills
  if (tools.includes("claude-code")) {
    removeLegacyClaudeSkills(root);
    const commandsInstalled = installClaudeCommandsFromSkills(path.join(root, ".claude", "commands"), skillsDir);
    if (!commandsInstalled) {
      writeGeneratedFiles(root, generateClaudeCodeCommands());
    }
  }

  // Cursor commands
  if (tools.includes("cursor")) {
    writeGeneratedFiles(root, generateCursorCommands());
  }

  if (tools.includes("codex")) {
    installCodexSkills(root, skillsDir);
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

  // Guard: reject home directory — common accident, always wrong
  if (root === os.homedir()) {
    console.log(chalk.red("\n  Cannot initialize in your home directory."));
    console.log(chalk.dim("  cd into a project first, then run whyspec init.\n"));
    process.exitCode = 1;
    return;
  }

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
      const commandCheck = path.join(root, ".claude", "commands", "whyspec:plan.md");
      const removedLegacySkills = removeLegacyClaudeSkills(root);
      if (removedLegacySkills) {
        repaired = true;
      }
      if (!fs.existsSync(commandCheck)) {
        console.log(chalk.yellow("\n  Repairing missing Claude commands...\n"));
        installSkillFiles(root, tools);
        generateAgentsMd(root, tools);
        repaired = true;
      }
    }

    if (tools.includes("codex")) {
      const codexSkillCheck = path.join(getCodexSkillsRoot(), "whyspec-plan", "SKILL.md");
      if (!fs.existsSync(codexSkillCheck)) {
        console.log(chalk.yellow("\n  Repairing missing Codex skills...\n"));
        installSkillFiles(root, tools);
        repaired = true;
      }
    }

    const gitignorePath = path.join(root, ".gitignore");
    const gitExcludePath = path.join(root, ".git", "info", "exclude");
    const beforeGitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, "utf-8") : "";
    const beforeGitExclude = fs.existsSync(gitExcludePath) ? fs.readFileSync(gitExcludePath, "utf-8") : "";
    addToGitignore(root);
    const afterGitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, "utf-8") : "";
    const afterGitExclude = fs.existsSync(gitExcludePath) ? fs.readFileSync(gitExcludePath, "utf-8") : "";
    if (beforeGitignore !== afterGitignore || beforeGitExclude !== afterGitExclude) {
      repaired = true;
    }

    try {
      const beforeSettings = fs.existsSync(path.join(root, ".vscode", "settings.json"))
        ? fs.readFileSync(path.join(root, ".vscode", "settings.json"), "utf-8")
        : "";
      ensureVsCodeShowsGitwhy(root);
      const afterSettings = fs.readFileSync(path.join(root, ".vscode", "settings.json"), "utf-8");
      if (beforeSettings !== afterSettings) {
        repaired = true;
      }
    } catch {
      // Leave malformed user settings untouched and continue with existing repair work.
    }

    if (tools.includes("codex")) {
      const hadAlias = fs.existsSync(path.join(root, "gitwhy"));
      ensureVisibleGitwhyAlias(root, tools);
      if (!hadAlias && fs.existsSync(path.join(root, "gitwhy"))) {
        repaired = true;
      }
    }

    if (repaired) {
      const exampleCommand = tools.includes("claude-code") || tools.includes("cursor")
        ? tools.includes("claude-code")
          ? "/whyspec:plan"
          : "/whyspec-plan"
        : tools.includes("codex")
          ? "$whyspec-plan"
          : "whyspec plan";
      console.log(chalk.green.bold("  \u2713 Skills installed successfully!"));
      console.log(`\n  Try: ${chalk.cyan.bold(exampleCommand)}\n`);
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

  // 6. Ignore .gitwhy for Git without hiding it from agent file trees
  addToGitignore(root);
  ensureVsCodeShowsGitwhy(root);
  ensureVisibleGitwhyAlias(root, selectedTools);

  // 7. Install skill files
  installSkillFiles(root, selectedTools);

  // 8. Generate AGENTS.md
  generateAgentsMd(root, selectedTools);

  // 9. Success message
  console.log(renderSuccessMessage(selectedTools));
}
