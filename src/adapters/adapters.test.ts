import { describe, it, expect } from "vitest";
import { generateClaudeCodeSkills } from "./claude-code.js";
import { generateCursorCommands } from "./cursor.js";
import { generateAgentsMd } from "./agents-md.js";
import { WHYSPEC_COMMANDS, COMMAND_DESCRIPTIONS } from "./types.js";

// ─── Claude Code Adapter ─────────────────────────────────────────────────────

describe("claude-code adapter", () => {
  const files = generateClaudeCodeSkills();

  it("generates 6 SKILL.md files", () => {
    expect(files).toHaveLength(6);
  });

  it("generates correct file paths", () => {
    const paths = files.map((f) => f.path);
    for (const command of WHYSPEC_COMMANDS) {
      expect(paths).toContain(`.claude/skills/whyspec-${command}/SKILL.md`);
    }
  });

  it("each file has valid YAML frontmatter with name and description", () => {
    for (const file of files) {
      // Frontmatter is delimited by --- lines
      expect(file.content).toMatch(/^---\n/);
      const parts = file.content.split("---");
      // parts[0] is empty (before first ---), parts[1] is frontmatter
      expect(parts.length).toBeGreaterThanOrEqual(3);

      const frontmatter = parts[1];
      expect(frontmatter).toMatch(/name:\s*whyspec-\w+/);
      expect(frontmatter).toMatch(/description:\s*.+/);
    }
  });

  it("frontmatter name matches the command in the path", () => {
    for (const file of files) {
      const pathMatch = file.path.match(/whyspec-(\w+)/);
      const nameMatch = file.content.match(/name:\s*whyspec-(\w+)/);
      expect(pathMatch).not.toBeNull();
      expect(nameMatch).not.toBeNull();
      expect(pathMatch![1]).toBe(nameMatch![1]);
    }
  });

  it("frontmatter description matches COMMAND_DESCRIPTIONS", () => {
    for (const file of files) {
      const commandMatch = file.path.match(
        /whyspec-(plan|execute|capture|show|search|debug)/,
      );
      expect(commandMatch).not.toBeNull();
      const command = commandMatch![1] as keyof typeof COMMAND_DESCRIPTIONS;
      expect(file.content).toContain(
        `description: ${COMMAND_DESCRIPTIONS[command]}`,
      );
    }
  });

  it("each file has non-empty instructions after frontmatter", () => {
    for (const file of files) {
      const parts = file.content.split("---");
      // Everything after the second --- is instructions
      const instructions = parts.slice(2).join("---").trim();
      expect(instructions.length).toBeGreaterThan(50);
    }
  });

  it("each file references the CLI-as-oracle pattern", () => {
    for (const file of files) {
      expect(file.content).toContain("whyspec");
      expect(file.content).toContain("--json");
    }
  });

  it("respects projectRoot prefix", () => {
    const prefixed = generateClaudeCodeSkills("/my/project");
    for (const file of prefixed) {
      expect(file.path).toMatch(/^\/my\/project\//);
    }
  });
});

// ─── Cursor Adapter ──────────────────────────────────────────────────────────

describe("cursor adapter", () => {
  const files = generateCursorCommands();

  it("generates 6 command files", () => {
    expect(files).toHaveLength(6);
  });

  it("generates correct file paths in .cursor/commands/", () => {
    const paths = files.map((f) => f.path);
    for (const command of WHYSPEC_COMMANDS) {
      expect(paths).toContain(`.cursor/commands/whyspec-${command}.md`);
    }
  });

  it("each file contains a markdown heading with the command name", () => {
    for (const file of files) {
      expect(file.content).toMatch(/^# WhySpec \w+/);
    }
  });

  it("each file contains the command description", () => {
    for (const file of files) {
      const commandMatch = file.path.match(
        /whyspec-(plan|execute|capture|show|search|debug)/,
      );
      expect(commandMatch).not.toBeNull();
      const command = commandMatch![1] as keyof typeof COMMAND_DESCRIPTIONS;
      expect(file.content).toContain(COMMAND_DESCRIPTIONS[command]);
    }
  });

  it("each file references whyspec CLI with --json flag", () => {
    for (const file of files) {
      const commandMatch = file.path.match(/whyspec-(\w+)\.md/);
      expect(commandMatch).not.toBeNull();
      expect(file.content).toContain(`whyspec ${commandMatch![1]} --json`);
    }
  });

  it("each file has an Objective section", () => {
    for (const file of files) {
      expect(file.content).toContain("## Objective");
    }
  });

  it("each file has a Workflow section", () => {
    for (const file of files) {
      expect(file.content).toContain("## Workflow");
    }
  });

  it("each file has an Important section", () => {
    for (const file of files) {
      expect(file.content).toContain("## Important");
    }
  });

  it("no file has YAML frontmatter (Cursor uses plain markdown)", () => {
    for (const file of files) {
      expect(file.content).not.toMatch(/^---\n/);
    }
  });

  it("respects projectRoot prefix", () => {
    const prefixed = generateCursorCommands("/my/project");
    for (const file of prefixed) {
      expect(file.path).toMatch(/^\/my\/project\//);
    }
  });
});

// ─── AGENTS.md Adapter ───────────────────────────────────────────────────────

describe("agents-md adapter", () => {
  const files = generateAgentsMd();

  it("generates exactly 1 file", () => {
    expect(files).toHaveLength(1);
  });

  it("file path is AGENTS.md", () => {
    expect(files[0].path).toBe("AGENTS.md");
  });

  it("contains WhySpec heading", () => {
    expect(files[0].content).toContain("# WhySpec");
  });

  it("contains all 6 command names", () => {
    for (const command of WHYSPEC_COMMANDS) {
      expect(files[0].content).toContain(`whyspec ${command}`);
    }
  });

  it("contains all command descriptions", () => {
    for (const command of WHYSPEC_COMMANDS) {
      expect(files[0].content).toContain(COMMAND_DESCRIPTIONS[command]);
    }
  });

  it("contains Decision Bridge section", () => {
    expect(files[0].content).toContain("Decision Bridge");
  });

  it("explains the CLI-as-oracle pattern with --json", () => {
    expect(files[0].content).toContain("--json");
    expect(files[0].content).toContain("CLI-as-Oracle");
  });

  it("contains example workflow section", () => {
    expect(files[0].content).toContain("Example Workflow");
    // The workflow shows all 3 steps
    expect(files[0].content).toContain("Step 1: Plan");
    expect(files[0].content).toContain("Step 2: Execute");
    expect(files[0].content).toContain("Step 3: Capture");
  });

  it("contains example JSON response", () => {
    expect(files[0].content).toContain("```json");
  });

  it("mentions supported tools", () => {
    const content = files[0].content;
    expect(content).toContain("Copilot");
    expect(content).toContain("Windsurf");
    expect(content).toContain("Cline");
    expect(content).toContain("Amazon Q");
    expect(content).toContain("RooCode");
    expect(content).toContain("Codex");
  });

  it("contains debugging section", () => {
    expect(files[0].content).toContain("Debugging");
    expect(files[0].content).toContain("scientific method");
  });

  it("respects projectRoot prefix", () => {
    const prefixed = generateAgentsMd("/my/project");
    expect(prefixed[0].path).toBe("/my/project/AGENTS.md");
  });
});
