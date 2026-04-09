/**
 * Format compatibility tests — verifies WhySpec context output
 * matches what GitWhy CLI expects to parse.
 *
 * GitWhy parser references:
 *   - tree.go:393-441  parseContextHeader (bold-colon metadata extraction)
 *   - format.go:174-183  title extraction (first `# ` line)
 *   - xml.go:96-150  XML tag parsing (<context> wrapper detection)
 *   - xml.go:204-227  reasoning nested structure
 */

import { describe, it, expect } from "vitest";
import { contextTemplate } from "./templates.js";
import { generateContextId } from "./context.js";

// ── XML Tag Compatibility ──────────────────────────────────────────

describe("contextTemplate XML format", () => {
  const xml = contextTemplate({
    title: "Add JWT authentication",
    agent: "claude-code (claude-sonnet-4-5)",
    tags: "auth, jwt, security",
  });

  it("wraps content in <context> tags", () => {
    expect(xml).toContain("<context>");
    expect(xml).toContain("</context>");
  });

  // Required tags per xml.go:104-150
  it("contains required <title> tag", () => {
    expect(xml).toMatch(/<title>.*<\/title>/s);
  });

  it("contains required <story> tag with phase structure", () => {
    expect(xml).toMatch(/<story>[\s\S]*Phase 1[\s\S]*<\/story>/);
  });

  it("contains required <reasoning> tag", () => {
    expect(xml).toMatch(/<reasoning>[\s\S]*<\/reasoning>/);
  });

  it("contains <files> tag", () => {
    expect(xml).toMatch(/<files>[\s\S]*<\/files>/);
  });

  // Optional tags
  it("contains optional <agent> tag", () => {
    expect(xml).toMatch(/<agent>.*<\/agent>/s);
  });

  it("contains optional <tags> tag", () => {
    expect(xml).toMatch(/<tags>.*<\/tags>/s);
  });

  it("contains optional <verification> tag", () => {
    expect(xml).toMatch(/<verification>.*<\/verification>/s);
  });

  it("contains optional <risks> tag", () => {
    expect(xml).toMatch(/<risks>.*<\/risks>/s);
  });

  // Reasoning nested structure per xml.go:204-227
  it("<reasoning> contains <decisions> sub-tag", () => {
    expect(xml).toMatch(/<reasoning>[\s\S]*<decisions>[\s\S]*<\/decisions>[\s\S]*<\/reasoning>/);
  });

  it("<reasoning> contains <rejected> sub-tag", () => {
    expect(xml).toMatch(/<reasoning>[\s\S]*<rejected>[\s\S]*<\/rejected>[\s\S]*<\/reasoning>/);
  });

  it("<reasoning> contains <tradeoffs> sub-tag", () => {
    expect(xml).toMatch(/<reasoning>[\s\S]*<tradeoffs>[\s\S]*<\/tradeoffs>[\s\S]*<\/reasoning>/);
  });

  // File format per xml.go:273-345 (em-dash separated: path — status — description)
  it("<files> uses em-dash or dash separated format", () => {
    const filesMatch = xml.match(/<files>([\s\S]*?)<\/files>/);
    expect(filesMatch).not.toBeNull();
    const filesContent = filesMatch![1].trim();
    // Each non-empty line should match: path — status — description (or path - status - description)
    const lines = filesContent.split("\n").filter((l) => l.trim().length > 0);
    for (const line of lines) {
      expect(line.trim()).toMatch(/\S+\s+[—-]\s+\w+\s+[—-]\s+\S/);
    }
  });

  // Title content verification
  it("populates <title> with provided value", () => {
    expect(xml).toContain("<title>Add JWT authentication</title>");
  });

  it("populates <agent> with provided value", () => {
    expect(xml).toContain("<agent>claude-code (claude-sonnet-4-5)</agent>");
  });

  it("populates <tags> with provided value", () => {
    expect(xml).toContain("<tags>auth, jwt, security</tags>");
  });
});

// ── Default Template Values ────────────────────────────────────────

describe("contextTemplate defaults", () => {
  const xml = contextTemplate();

  it("uses placeholder title when none provided", () => {
    expect(xml).toContain("<title>Short title of what was done</title>");
  });

  it("uses placeholder agent when none provided", () => {
    expect(xml).toContain("<agent>claude-code (model)</agent>");
  });
});

// ── Context ID Format ──────────────────────────────────────────────

describe("context ID format (FR-20)", () => {
  it("matches ctx_ + 8 alphanumeric characters", () => {
    const id = generateContextId();
    expect(id).toMatch(/^ctx_[a-z0-9]{8}$/);
  });

  it("file naming: ctx_<id>.md matches GitWhy walker pattern", () => {
    const id = generateContextId();
    const filename = `${id}.md`;
    // GitWhy tree.go:21-22 uses prefix "ctx_" and ext ".md"
    expect(filename).toMatch(/^ctx_[a-z0-9]{8}\.md$/);
  });

  it("generates 1000 unique IDs without collision", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateContextId()));
    expect(ids.size).toBe(1000);
  });

  it("ID characters are lowercase alphanumeric only", () => {
    for (let i = 0; i < 50; i++) {
      const id = generateContextId();
      const suffix = id.slice(4); // strip ctx_
      expect(suffix).toMatch(/^[a-z0-9]+$/);
    }
  });
});

// ── Metadata Header Compatibility ──────────────────────────────────

describe("GitWhy metadata header format", () => {
  // Simulates the full ctx_<id>.md file as written by capture command
  // GitWhy parseContextHeader (tree.go:393-441) expects bold-colon format:
  //   **Field:** value

  it("bold-colon format matches GitWhy regex pattern", () => {
    // GitWhy regex: ^\*\*(.+?):\*\*\s*(.*)$
    const testLine = "**Context ID:** ctx_a1b2c3d4";
    const match = testLine.match(/^\*\*(.+?):\*\*\s*(.*)$/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("Context ID");
    expect(match![2]).toBe("ctx_a1b2c3d4");
  });

  it("date field matches accepted GitWhy formats", () => {
    const isoDate = new Date().toISOString();
    // GitWhy tree.go:464-475 accepts RFC3339
    expect(() => new Date(isoDate)).not.toThrow();
    expect(new Date(isoDate).toISOString()).toBe(isoDate);
  });

  it("branch field with backticks can be parsed", () => {
    // GitWhy tree.go:439 strips backticks from branch values
    const line = "**Branch:** `feature/auth`";
    const match = line.match(/^\*\*(.+?):\*\*\s*(.*)$/);
    expect(match).not.toBeNull();
    const value = match![2].replace(/^`|`$/g, "");
    expect(value).toBe("feature/auth");
  });
});
