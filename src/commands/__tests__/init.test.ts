import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  createGitwhyDir,
  writeConfigYaml,
  addToGitignore,
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
  it("creates .gitwhy/ and .gitwhy/changes/ directories", () => {
    createGitwhyDir(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, ".gitwhy"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, ".gitwhy", "changes"))).toBe(true);
    expect(fs.statSync(path.join(tmpDir, ".gitwhy")).isDirectory()).toBe(true);
    expect(fs.statSync(path.join(tmpDir, ".gitwhy", "changes")).isDirectory()).toBe(true);
  });

  it("is idempotent — calling twice does not throw", () => {
    createGitwhyDir(tmpDir);
    expect(() => createGitwhyDir(tmpDir)).not.toThrow();
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

    const raw = fs.readFileSync(path.join(tmpDir, ".gitwhy", "config.yaml"), "utf-8");
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

    const raw = fs.readFileSync(path.join(tmpDir, ".gitwhy", "config.yaml"), "utf-8");
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

    const raw = fs.readFileSync(path.join(tmpDir, ".gitwhy", "config.yaml"), "utf-8");
    expect(raw.startsWith("# WhySpec project configuration")).toBe(true);
  });

  it("respects telemetry: false", () => {
    writeConfigYaml(tmpDir, {
      projectName: "my-app",
      projectDescription: "",
      tools: ["claude-code"],
      telemetry: false,
    });

    const raw = fs.readFileSync(path.join(tmpDir, ".gitwhy", "config.yaml"), "utf-8");
    const config = YAML.parse(raw);
    expect(config.telemetry).toBe(false);
  });
});

// ── addToGitignore ───────────────────────────────────────────────────

describe("addToGitignore", () => {
  it("creates .gitignore if it does not exist", () => {
    addToGitignore(tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toBe(".gitwhy/\n");
  });

  it("appends to existing .gitignore", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "node_modules/\n", "utf-8");

    addToGitignore(tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toBe("node_modules/\n.gitwhy/\n");
  });

  it("appends with newline if existing file has no trailing newline", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "node_modules/", "utf-8");

    addToGitignore(tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    expect(content).toBe("node_modules/\n.gitwhy/\n");
  });

  it("does not duplicate entry if already present", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "node_modules/\n.gitwhy/\n", "utf-8");

    addToGitignore(tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, ".gitignore"), "utf-8");
    const matches = content.split("\n").filter((l) => l.trim() === ".gitwhy/");
    expect(matches).toHaveLength(1);
  });
});

// ── installSkillFiles ────────────────────────────────────────────────

describe("installSkillFiles", () => {
  it("creates 6 SKILL.md files for claude-code", () => {
    installSkillFiles(tmpDir, ["claude-code"]);

    const commands = ["plan", "execute", "capture", "show", "search", "debug"];
    for (const cmd of commands) {
      const skillPath = path.join(tmpDir, ".claude", "skills", `whyspec-${cmd}`, "SKILL.md");
      expect(fs.existsSync(skillPath)).toBe(true);

      const content = fs.readFileSync(skillPath, "utf-8");
      expect(content).toContain(`name: whyspec:${cmd}`);
      expect(content).toContain("---");
    }
  });

  it("does nothing if claude-code is not selected", () => {
    installSkillFiles(tmpDir, ["cursor", "copilot"]);

    expect(fs.existsSync(path.join(tmpDir, ".claude"))).toBe(false);
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
    expect(content).toContain("/whyspec:plan");
    expect(content).toContain("/whyspec:capture");
    expect(content).toContain("GitHub Copilot");
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
