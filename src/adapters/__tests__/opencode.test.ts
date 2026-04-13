import { describe, it, expect } from "vitest";
import { generateOpenCodeSkills } from "../opencode.js";
import { WHYSPEC_COMMANDS } from "../types.js";

describe("generateOpenCodeSkills", () => {
  const files = generateOpenCodeSkills();

  it("returns 6 GeneratedFile entries (one per command)", () => {
    expect(files).toHaveLength(6);
  });

  it("generates paths matching .opencode/skills/whyspec-{cmd}/SKILL.md", () => {
    for (const cmd of WHYSPEC_COMMANDS) {
      const match = files.find(
        (f) => f.path === `.opencode/skills/whyspec-${cmd}/SKILL.md`,
      );
      expect(match, `missing skill file for command: ${cmd}`).toBeDefined();
    }
  });

  it("includes name, description, and compatibility in YAML frontmatter", () => {
    for (const file of files) {
      expect(file.content).toMatch(/^---\n/);
      expect(file.content).toMatch(/\nname: whyspec-/);
      expect(file.content).toMatch(/\ndescription: /);
      expect(file.content).toMatch(/\ncompatibility: opencode\n/);
      expect(file.content).toMatch(/\n---\n/);
    }
  });

  it("includes skill instructions body", () => {
    for (const file of files) {
      expect(file.content).toContain("## Use this skill when");
      expect(file.content).toContain("## Do not use this skill when");
      expect(file.content).toContain("## Instructions");
    }
  });

  it("includes CLI references in instructions", () => {
    for (const file of files) {
      expect(file.content).toContain("whyspec");
      expect(file.content).toContain("--json");
    }
  });

  it("respects projectRoot prefix", () => {
    const prefixed = generateOpenCodeSkills("/custom/root");
    for (const file of prefixed) {
      expect(file.path).toMatch(/^\/custom\/root\/.opencode\/skills\/whyspec-/);
    }
  });
});
