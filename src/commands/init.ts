import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import YAML from "yaml";
import { renderWelcomeScreen, renderTelemetryNotice, renderSuccessMessage } from "../ui/welcome.js";
import { promptToolPicker, needsAgentsMd } from "../ui/tool-picker.js";
import { readConfig } from "../core/config.js";
import { PRIMARY_STORAGE_DIR, resolveStorageDirName, storageDirPath } from "../core/storage-root.js";
import { generateCursorCommands } from "../adapters/cursor.js";
import { generateCodexSkills } from "../adapters/codex.js";
import { generateAgentsMd as generateAgentsMdAdapter } from "../adapters/agents-md.js";
import { generateAntigravitySkills } from "../adapters/antigravity.js";
import { type GeneratedFile } from "../adapters/types.js";

// ── Types ────────────────────────────────────────────────────────────

export interface ConfigOptions {
  projectName: string;
  projectDescription: string;
  tools: string[];
  telemetry: boolean;
}

// ── Filesystem helpers (testable, accept root) ───────────────────────

export function createGitwhyDir(root: string): void {
  const gitwhyDir = storageDirPath(root);
  const changesDir = path.join(gitwhyDir, "changes");
  const archiveDir = path.join(gitwhyDir, "archive");
  const debugDir = path.join(gitwhyDir, "debug");
  fs.mkdirSync(changesDir, { recursive: true });
  fs.mkdirSync(archiveDir, { recursive: true });
  fs.mkdirSync(debugDir, { recursive: true });
}

export function removeLegacyGitwhyAlias(root: string): boolean {
  const helperPath = path.join(root, "gitwhy");
  const primaryPath = path.join(root, PRIMARY_STORAGE_DIR);
  const oldestLegacyPath = path.join(root, ".gitwhy");
  if (!fs.lstatSync(helperPath, { throwIfNoEntry: false })) {
    return false;
  }

  const helperStat = fs.lstatSync(helperPath);
  if (helperStat.isSymbolicLink()) {
    const helperTarget = fs.readlinkSync(helperPath);
    const resolvedTarget = path.resolve(path.dirname(helperPath), helperTarget);
    const resolvedOldestLegacy = path.resolve(oldestLegacyPath);

    if (!fs.existsSync(primaryPath) && fs.existsSync(oldestLegacyPath) && resolvedTarget === resolvedOldestLegacy) {
      fs.renameSync(oldestLegacyPath, primaryPath);
    }
    fs.unlinkSync(helperPath);
    return true;
  }

  if (!helperStat.isDirectory()) {
    return false;
  }

  const readmePath = path.join(helperPath, "README.md");
  const readmeContent = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, "utf-8") : "";
  const isKnownLegacyHelper = readmeContent.includes("This visible folder mirrors `.gitwhy/` for Codex file trees.");

  if (!isKnownLegacyHelper) {
    return false;
  }

  if (!fs.existsSync(primaryPath) && fs.existsSync(oldestLegacyPath)) {
    fs.renameSync(oldestLegacyPath, primaryPath);
  }

  fs.rmSync(helperPath, { recursive: true, force: true });
  return true;
}

export function migrateLegacyStorage(root: string): boolean {
  const primaryPath = path.join(root, PRIMARY_STORAGE_DIR);
  const activeDirName = resolveStorageDirName(root);
  const activePath = path.join(root, activeDirName);

  if (activeDirName === PRIMARY_STORAGE_DIR || fs.existsSync(primaryPath)) {
    return false;
  }

  const activeStat = fs.lstatSync(activePath, { throwIfNoEntry: false });
  if (!activeStat || !activeStat.isDirectory() || activeStat.isSymbolicLink()) {
    return false;
  }

  fs.renameSync(activePath, primaryPath);
  return true;
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
  fs.writeFileSync(path.join(storageDirPath(root), "config.yaml"), header + yamlStr, "utf-8");
}

export function addToGitignore(root: string): void {
  const entries = [".gitwhy/", "gitwhy/", "whyspec/"];
  const gitignorePath = path.join(root, ".gitignore");
  const gitDir = path.join(root, ".git");
  const gitExcludePath = path.join(gitDir, "info", "exclude");

  const removeEntry = (filePath: string): void => {
    if (!fs.existsSync(filePath)) {
      return;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const filtered = lines.filter((line) => !entries.includes(line.trim()));

    if (filtered.length !== lines.length) {
      fs.writeFileSync(filePath, filtered.join("\n"), "utf-8");
    }
  };

  // Keep visible WhySpec roots unmanaged by ignore files during migration.
  removeEntry(gitignorePath);
  removeEntry(gitExcludePath);
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
  filesExclude["gitwhy"] = false;
  filesExclude["whyspec"] = false;
  settings["files.exclude"] = filesExclude;

  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
}

/**
 * Install authored skill files from skill-sources/ if they exist.
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

    const dest = path.join(root, "skills", `whyspec-${cmd}`, "SKILL.md");
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    installed = true;
  }
  return installed;
}

function removeLegacyClaudeCommands(root: string): boolean {
  const commandsRoot = path.join(root, ".claude", "commands");
  let removed = false;

  for (const cmd of WHYSPEC_COMMANDS) {
    const legacyPath = path.join(commandsRoot, `whyspec:${cmd}.md`);
    if (fs.existsSync(legacyPath)) {
      fs.rmSync(legacyPath, { force: true });
      removed = true;
    }
  }

  if (removed && fs.existsSync(commandsRoot) && fs.readdirSync(commandsRoot).length === 0) {
    fs.rmdirSync(commandsRoot);
  }

  return removed;
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
  return path.join(path.dirname(path.dirname(currentDir)), "skill-sources");
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
    removeLegacyClaudeCommands(root);
    removeLegacyClaudeSkills(root);
    installClaudeCommandsFromSkills(root, skillsDir);
  }

  // Cursor commands
  if (tools.includes("cursor")) {
    writeGeneratedFiles(root, generateCursorCommands());
  }

  if (tools.includes("codex")) {
    installCodexSkills(root, skillsDir);
  }

  // Antigravity skills
  if (tools.includes("antigravity")) {
    writeGeneratedFiles(root, generateAntigravitySkills());
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

  // Upgrade legacy hidden storage before deciding whether initialization already exists.
  migrateLegacyStorage(root);
  removeLegacyGitwhyAlias(root);
  const gitwhyDir = path.join(root, resolveStorageDirName(root));

  // Guard: already initialized — but repair missing skills from partial init
  if (fs.existsSync(gitwhyDir)) {
    const config = readConfig(root);
    const tools = config.tools ?? ["claude-code"];
    let repaired = false;

    // Check if skills need to be installed (e.g. prior crash before skill step)
    if (tools.includes("claude-code")) {
      const skillCheck = path.join(root, "skills", "whyspec-plan", "SKILL.md");
      const removedLegacyCommands = removeLegacyClaudeCommands(root);
      const removedLegacySkills = removeLegacyClaudeSkills(root);
      if (removedLegacyCommands || removedLegacySkills) {
        repaired = true;
      }
      if (!fs.existsSync(skillCheck)) {
        console.log(chalk.yellow("\n  Repairing missing Claude Code skills...\n"));
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

    if (tools.includes("antigravity")) {
      const antigravitySkillCheck = path.join(root, ".agent", "skills", "whyspec-plan", "SKILL.md");
      if (!fs.existsSync(antigravitySkillCheck)) {
        console.log(chalk.yellow("\n  Repairing missing Antigravity skills...\n"));
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

    if (repaired) {
      const exampleCommand = tools.includes("claude-code") || tools.includes("cursor")
        ? "/whyspec-plan"
        : tools.includes("codex")
          ? "$whyspec-plan"
          : "whyspec plan";
      console.log(chalk.green.bold("  \u2713 Skills installed successfully!"));
      console.log(`\n  Try: ${chalk.cyan.bold(exampleCommand)}\n`);
    } else {
      console.log(chalk.yellow("\n  WhySpec is already initialized in this directory."));
      console.log(chalk.dim(`  ${resolveStorageDirName(root)}/ already exists.\n`));
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

  // 4. Create storage structure
  createGitwhyDir(root);

  // 5. Write config.yaml
  const projectName = detectProjectName(root);
  writeConfigYaml(root, {
    projectName,
    projectDescription: "",
    tools: selectedTools,
    telemetry: process.env.WHYSPEC_TELEMETRY !== "0",
  });

  // 6. Keep storage visible to tools and repair any legacy ignore entries
  addToGitignore(root);
  ensureVsCodeShowsGitwhy(root);
  removeLegacyGitwhyAlias(root);

  // 7. Install skill files
  installSkillFiles(root, selectedTools);

  // 8. Generate AGENTS.md
  generateAgentsMd(root, selectedTools);

  // 9. Success message
  console.log(renderSuccessMessage(selectedTools));
}
