import { describe, it, expect } from "vitest";
import { generateAntigravitySkills } from "../antigravity.js";
import { WHYSPEC_COMMANDS } from "../types.js";

describe("generateAntigravitySkills", () => {
  const files = generateAntigravitySkills();

  it("returns 6 GeneratedFile entries (one per command)", () => {
    expect(files).toHaveLength(6);
  });

  it("generates paths matching .agent/skills/whyspec-{cmd}/SKILL.md", () => {
    for (const cmd of WHYSPEC_COMMANDS) {
      const match = files.find(
        (f) => f.path === `.agent/skills/whyspec-${cmd}/SKILL.md`,
      );
      expect(match, `missing skill file for command: ${cmd}`).toBeDefined();
    }
  });

  it("includes name and description in YAML frontmatter", () => {
    for (const file of files) {
      expect(file.content).toMatch(/^---\n/);
      expect(file.content).toMatch(/\nname: whyspec-/);
      expect(file.content).toMatch(/\ndescription: /);
      expect(file.content).toMatch(/\n---\n/);
    }
  });

  it("includes skill instructions body", () => {
    for (const file of files) {
      // All skills should have the Antigravity-convention sections
      expect(file.content).toContain("## Use this skill when");
      expect(file.content).toContain("## Do not use this skill when");
      expect(file.content).toContain("## Instructions");
    }
  });

  it("respects projectRoot prefix", () => {
    const prefixed = generateAntigravitySkills("/custom/root");
    for (const file of prefixed) {
      expect(file.path).toMatch(/^\/custom\/root\/.agent\/skills\/whyspec-/);
    }
  });
});
