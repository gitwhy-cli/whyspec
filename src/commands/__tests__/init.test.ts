import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  createGitwhyDir,
  writeConfigYaml,
  addToGitignore,
  ensureVsCodeShowsGitwhy,
  removeLegacyGitwhyAlias,
  migrateLegacyStorage,
  installSkillFiles,
  generateAgentsMd,
  detectProjectName,
} from "../init.js";
import YAML from "yaml";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "whyspec-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── createGitwhyDir ──────────────────────────────────────────────────

describe("createGitwhyDir", () => {
  it("creates the full whyspec directory structure", () => {
    createGitwhyDir(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, "whyspec"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "whyspec", "changes"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "whyspec", "archive"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "whyspec", "debug"))).toBe(true);
    expect(fs.statSync(path.join(tmpDir, "whyspec")).isDirectory()).toBe(true);
    expect(fs.statSync(path.join(tmpDir, "whyspec", "changes")).isDirectory()).toBe(true);
    expect(fs.statSync(path.join(tmpDir, "whyspec", "archive")).isDirectory()).toBe(true);
    expect(fs.statSync(path.join(tmpDir, "whyspec", "debug")).isDirectory()).toBe(true);
  });

  it("is idempotent — calling twice does not throw", () => {
    createGitwhyDir(tmpDir);
    expect(() => createGitwhyDir(tmpDir)).not.toThrow();
  });
});

describe("removeLegacyGitwhyAlias", () => {
  it("removes the legacy gitwhy helper symlink", () => {
    fs.symlinkSync(".gitwhy", path.join(tmpDir, "gitwhy"), "dir");

    expect(removeLegacyGitwhyAlias(tmpDir)).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "gitwhy"))).toBe(false);
  });

  it("removes the legacy gitwhy helper directory created by older versions", () => {
    const helperPath = path.join(tmpDir, "gitwhy");
    fs.mkdirSync(helperPath, { recursive: true });
    fs.writeFileSync(
      path.join(helperPath, "README.md"),
      [
        "# WhySpec workspace",
        "",
        "This visible folder mirrors `.gitwhy/` for Codex file trees.",
        "Edit files through `gitwhy/` or `.gitwhy/` interchangeably.",
        "",
      ].join("\n"),
      "utf-8",
    );
    fs.mkdirSync(path.join(helperPath, "archive"), { recursive: true });

    expect(removeLegacyGitwhyAlias(tmpDir)).toBe(true);
    expect(fs.existsSync(helperPath)).toBe(false);
  });

  it("does not remove an unrelated user gitwhy directory", () => {
    const helperPath = path.join(tmpDir, "gitwhy");
    fs.mkdirSync(helperPath, { recursive: true });
    fs.writeFileSync(path.join(helperPath, "README.md"), "# My notes\n", "utf-8");

    expect(removeLegacyGitwhyAlias(tmpDir)).toBe(false);
    expect(fs.existsSync(helperPath)).toBe(true);
  });
});

describe("migrateLegacyStorage", () => {
  it("renames legacy gitwhy storage to whyspec when the canonical root is absent", () => {
    fs.mkdirSync(path.join(tmpDir, "gitwhy", "changes"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "gitwhy", "config.yaml"), "version: \"1.0\"\n", "utf-8");

    expect(migrateLegacyStorage(tmpDir)).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "gitwhy"))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, "whyspec"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "whyspec", "changes"))).toBe(true);
    expect(fs.readFileSync(path.join(tmpDir, "whyspec", "config.yaml"), "utf-8")).toContain("version:");
  });

  it("renames legacy .gitwhy storage to whyspec when newer visible roots are absent", () => {
    fs.mkdirSync(path.join(tmpDir, ".gitwhy", "changes"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, ".gitwhy", "config.yaml"), "version: \"1.0\"\n", "utf-8");

    expect(migrateLegacyStorage(tmpDir)).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, ".gitwhy"))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, "whyspec"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "whyspec", "changes"))).toBe(true);
    expect(fs.readFileSync(path.join(tmpDir, "whyspec", "config.yaml"), "utf-8")).toContain("version:");
  });

  it("does not rename a legacy symlink helper during storage migration", () => {
    fs.mkdirSync(path.join(tmpDir, ".gitwhy"), { recursive: true });
    fs.symlinkSync(".gitwhy", path.join(tmpDir, "gitwhy"), "dir");

    expect(migrateLegacyStorage(tmpDir)).toBe(false);
    expect(fs.lstatSync(path.join(tmpDir, "gitwhy")).isSymbolicLink()).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "whyspec"))).toBe(false);
  });
});

// ── writeConfigYaml ──────────────────────────────────────────────────

describe("writeConfigYaml", () => {
  beforeEach(() => {
    createGitwhyDir(tmpDir);
  });

  it("writes valid YAML with all required fields", () => {
    writeConfigYaml(tmpDir, {
      projectName: "test-project",
      projectDescription: "A test",
      tools: ["claude-code", "cursor"],
      telemetry: true,
    });

    const raw = fs.readFileSync(path.join(tmpDir, "whyspec", "config.yaml"), "utf-8");
    const config = YAML.parse(raw);

    expect(config.version).toBe("1.0");
    expect(config.project.name).toBe("test-project");
    expect(config.project.description).toBe("A test");
    expect(config.telemetry).toBe(true);
    expect(config.tools).toEqual(["claude-code", "cursor"]);
  });

  it("includes context and rules placeholder sections", () => {
    writeConfigYaml(tmpDir, {
      projectName: "my-app",
      projectDescription: "",
      tools: ["claude-code"],
      telemetry: true,
    });

    const raw = fs.readFileSync(path.join(tmpDir, "whyspec", "config.yaml"), "utf-8");
    expect(raw).toContain("context:");
    expect(raw).toContain("rules:");
    expect(raw).toContain("# Describe your tech stack");
    expect(raw).toContain("# Add project-specific rules");
  });

  it("starts with a comment header", () => {
    writeConfigYaml(tmpDir, {
      projectName: "my-app",
      projectDescription: "",
      tools: [],
      telemetry: false,
    });

    const raw = fs.readFileSync(path.join(tmpDir, "whyspec", "config.yaml"), "utf-8");
    expect(raw.startsWith("# WhySpec project configuration")).toBe(true);
  });

  it("respects telemetry: false", () => {
    writeConfigYaml(tmpDir, {
      projectName: "my-app",
      projectDescription: "",
      tools: ["claude-code"],
      telemetry: false,
    });

    const raw = fs.readFileSync(path.join(tmpDir, "whyspec", "config.yaml"), "utf-8");
    const config = YAML.parse(raw);
    expect(config.telemetry).toBe(false);
  });
});

// ── addToGitignore ───────────────────────────────────────────────────

describe("addToGitignore", () => {
  it("does not create .gitignore if it does not exist", () => {
    addToGitignore(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, ".gitignore"))).toBe(false);
  });

  it("leaves existing .gitignore unchanged when .gitwhy/ is not present", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "node_modules/\n", "utf-8");

    addToGitignore(tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toBe("node_modules/\n");
  });

  it("removes visible WhySpec roots from .gitignore", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "node_modules/\n.gitwhy/\ngitwhy/\nwhyspec/\n", "utf-8");

    addToGitignore(tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toBe("node_modules/\n");
  });

  it("removes duplicate .gitwhy/ entries from .gitignore", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "node_modules/\n.gitwhy/\n.gitwhy/\n", "utf-8");

    addToGitignore(tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toBe("node_modules/\n");
  });

  it("does not create .gitignore even when .git directory exists", () => {
    fs.mkdirSync(path.join(tmpDir, ".git", "info"), { recursive: true });

    addToGitignore(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, ".gitignore"))).toBe(false);
  });

  it("removes visible WhySpec roots from both .gitignore and .git/info/exclude", () => {
    fs.mkdirSync(path.join(tmpDir, ".git", "info"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, ".git", "info", "exclude"),
      "# comments\n.gitwhy/\ngitwhy/\nwhyspec/\n",
      "utf-8",
    );
    fs.writeFileSync(
      path.join(tmpDir, ".gitignore"),
      "node_modules/\n",
      "utf-8",
    );

    addToGitignore(tmpDir);

    expect(fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8")).toBe("node_modules/\n");
    const excludeContent = fs.readFileSync(path.join(tmpDir, ".git", "info", "exclude"), "utf-8");
    expect(excludeContent).not.toContain(".gitwhy/");
    expect(excludeContent).not.toContain("gitwhy/");
    expect(excludeContent).not.toContain("whyspec/");
    expect(excludeContent).toBe("# comments\n");
  });
});

// ── ensureVsCodeShowsGitwhy ─────────────────────────────────────────

describe("ensureVsCodeShowsGitwhy", () => {
  it("creates .vscode/settings.json when missing", () => {
    ensureVsCodeShowsGitwhy(tmpDir);

    const settingsPath = path.join(tmpDir, ".vscode", "settings.json");
    expect(fs.existsSync(settingsPath)).toBe(true);

    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    expect(settings).toEqual({
      "files.exclude": {
        ".gitwhy": false,
        "gitwhy": false,
        "whyspec": false,
      },
    });
  });

  it("merges with existing settings without overwriting unrelated keys", () => {
    const vscodeDir = path.join(tmpDir, ".vscode");
    fs.mkdirSync(vscodeDir, { recursive: true });
    fs.writeFileSync(
      path.join(vscodeDir, "settings.json"),
      JSON.stringify({
        "editor.formatOnSave": true,
        "files.exclude": {
          dist: true,
        },
      }, null, 2),
      "utf-8",
    );

    ensureVsCodeShowsGitwhy(tmpDir);

    const settings = JSON.parse(
      fs.readFileSync(path.join(vscodeDir, "settings.json"), "utf-8"),
    );
    expect(settings["editor.formatOnSave"]).toBe(true);
    expect(settings["files.exclude"]).toEqual({
      dist: true,
      ".gitwhy": false,
      "gitwhy": false,
      "whyspec": false,
    });
  });

  it("forces .gitwhy visible even if it was previously excluded", () => {
    const vscodeDir = path.join(tmpDir, ".vscode");
    fs.mkdirSync(vscodeDir, { recursive: true });
    fs.writeFileSync(
      path.join(vscodeDir, "settings.json"),
      JSON.stringify({
        "files.exclude": {
          ".gitwhy": true,
          dist: true,
        },
      }, null, 2),
      "utf-8",
    );

    ensureVsCodeShowsGitwhy(tmpDir);

    const settings = JSON.parse(
      fs.readFileSync(path.join(vscodeDir, "settings.json"), "utf-8"),
    );
    expect(settings["files.exclude"]).toEqual({
      ".gitwhy": false,
      "gitwhy": false,
      "whyspec": false,
      dist: true,
    });
  });
});

// ── installSkillFiles ────────────────────────────────────────────────

describe("installSkillFiles", () => {
  it("creates 6 Claude Code skill directories for claude-code", () => {
    installSkillFiles(tmpDir, ["claude-code"]);

    const commands = ["plan", "execute", "capture", "show", "search", "debug"];
    for (const cmd of commands) {
      const skillPath = path.join(tmpDir, "skills", `whyspec-${cmd}`, "SKILL.md");
      expect(fs.existsSync(skillPath)).toBe(true);

      const skillContent = fs.readFileSync(skillPath, "utf-8");
      expect(skillContent).toContain("argument-hint:");
      expect(skillContent).toContain("/whyspec-");
    }

    expect(fs.existsSync(path.join(tmpDir, ".claude", "commands"))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, ".claude", "skills"))).toBe(false);
  });

  it("removes legacy Claude command files and legacy skill folders during reinstall", () => {
    const legacyPath = path.join(tmpDir, ".claude", "skills", "whyspec-plan");
    fs.mkdirSync(legacyPath, { recursive: true });
    fs.writeFileSync(path.join(legacyPath, "SKILL.md"), "legacy", "utf-8");
    const legacyCommandPath = path.join(tmpDir, ".claude", "commands", "whyspec:plan.md");
    fs.mkdirSync(path.dirname(legacyCommandPath), { recursive: true });
    fs.writeFileSync(legacyCommandPath, "legacy", "utf-8");

    installSkillFiles(tmpDir, ["claude-code"]);

    expect(fs.existsSync(legacyPath)).toBe(false);
    expect(fs.existsSync(legacyCommandPath)).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, "skills", "whyspec-plan", "SKILL.md"))).toBe(true);
  });

  it("does nothing if claude-code is not selected", () => {
    installSkillFiles(tmpDir, ["cursor", "copilot"]);

    expect(fs.existsSync(path.join(tmpDir, ".claude"))).toBe(false);
  });

  it("installs Codex skills into CODEX_HOME/skills when codex is selected", () => {
    const codexHome = path.join(tmpDir, ".codex-home");
    process.env.CODEX_HOME = codexHome;

    installSkillFiles(tmpDir, ["codex"]);

    const commands = ["plan", "execute", "capture", "show", "search", "debug"];
    for (const cmd of commands) {
      const skillDir = path.join(codexHome, "skills", `whyspec-${cmd}`);
      const skillPath = path.join(skillDir, "SKILL.md");
      const metadataPath = path.join(skillDir, "agents", "openai.yaml");

      expect(fs.existsSync(skillPath)).toBe(true);
      expect(fs.existsSync(metadataPath)).toBe(true);

      const skillContent = fs.readFileSync(skillPath, "utf-8");
      const metadataContent = fs.readFileSync(metadataPath, "utf-8");

      expect(skillContent).toContain(`name: whyspec-${cmd}`);
      expect(metadataContent).toContain("display_name:");
      expect(metadataContent).toContain("default_prompt:");
    }

    delete process.env.CODEX_HOME;
  });
});

// ── generateAgentsMd ─────────────────────────────────────────────────

describe("generateAgentsMd", () => {
  it("generates AGENTS.md when a tool needs it", () => {
    generateAgentsMd(tmpDir, ["copilot"]);

    const agentsMdPath = path.join(tmpDir, "AGENTS.md");
    expect(fs.existsSync(agentsMdPath)).toBe(true);

    const content = fs.readFileSync(agentsMdPath, "utf-8");
    expect(content).toContain("WhySpec");
    expect(content).toContain("whyspec plan");
    expect(content).toContain("whyspec capture");
    expect(content).toContain("Copilot");
  });

  it("does not generate AGENTS.md if no tool needs it", () => {
    generateAgentsMd(tmpDir, ["claude-code", "cursor"]);

    expect(fs.existsSync(path.join(tmpDir, "AGENTS.md"))).toBe(false);
  });

  it("lists multiple tool names when several are selected", () => {
    generateAgentsMd(tmpDir, ["copilot", "windsurf", "cline"]);

    const content = fs.readFileSync(path.join(tmpDir, "AGENTS.md"), "utf-8");
    expect(content).toContain("GitHub Copilot");
    expect(content).toContain("Windsurf");
    expect(content).toContain("Cline");
  });
});

// ── detectProjectName ────────────────────────────────────────────────

describe("detectProjectName", () => {
  it("reads name from package.json", () => {
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ name: "my-cool-app" }),
      "utf-8"
    );

    expect(detectProjectName(tmpDir)).toBe("my-cool-app");
  });

  it("strips npm scope from package name", () => {
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ name: "@gitwhy-cli/whyspec" }),
      "utf-8"
    );

    expect(detectProjectName(tmpDir)).toBe("whyspec");
  });

  it("falls back to directory basename if no package.json", () => {
    const name = detectProjectName(tmpDir);
    expect(name).toBe(path.basename(tmpDir));
  });

  it("falls back to directory basename if package.json has no name", () => {
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ version: "1.0.0" }),
      "utf-8"
    );

    expect(detectProjectName(tmpDir)).toBe(path.basename(tmpDir));
  });
});
