import { describe, it, expect } from "vitest";
import { mkdtempSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  generateContextId,
  gitwhyDir,
  changesDir,
  ensureDirectoryStructure,
  createChangeDir,
  readMarkdown,
  writeMarkdown,
  listChanges,
  changeExists,
} from "./storage.js";

function makeTmp(): string {
  return mkdtempSync(join(tmpdir(), "whyspec-storage-test-"));
}

describe("generateContextId", () => {
  it("matches ctx_ + 8 hex characters format", () => {
    const id = generateContextId();
    expect(id).toMatch(/^ctx_[a-f0-9]{8}$/);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateContextId()));
    expect(ids.size).toBe(100);
  });
});

describe("path helpers", () => {
  it("gitwhyDir returns .gitwhy path", () => {
    expect(gitwhyDir("/repo")).toBe(join("/repo", ".gitwhy"));
  });

  it("changesDir returns .gitwhy/changes path", () => {
    expect(changesDir("/repo")).toBe(join("/repo", ".gitwhy", "changes"));
  });
});

describe("ensureDirectoryStructure", () => {
  it("creates .gitwhy/, changes/, archive/, debug/", () => {
    const tmp = makeTmp();
    ensureDirectoryStructure(tmp);
    expect(existsSync(join(tmp, ".gitwhy"))).toBe(true);
    expect(existsSync(join(tmp, ".gitwhy", "changes"))).toBe(true);
    expect(existsSync(join(tmp, ".gitwhy", "archive"))).toBe(true);
    expect(existsSync(join(tmp, ".gitwhy", "debug"))).toBe(true);
  });

  it("is idempotent", () => {
    const tmp = makeTmp();
    ensureDirectoryStructure(tmp);
    ensureDirectoryStructure(tmp);
    expect(existsSync(join(tmp, ".gitwhy"))).toBe(true);
  });
});

describe("createChangeDir", () => {
  it("creates a named subdirectory under changes/", () => {
    const tmp = makeTmp();
    ensureDirectoryStructure(tmp);
    const dir = createChangeDir(tmp, "add-auth");
    expect(existsSync(dir)).toBe(true);
    expect(dir).toContain("add-auth");
  });
});

describe("readMarkdown / writeMarkdown", () => {
  it("roundtrips markdown content", () => {
    const tmp = makeTmp();
    ensureDirectoryStructure(tmp);
    const dir = createChangeDir(tmp, "test-change");
    writeMarkdown(dir, "intent.md", "# Intent\nTest content");
    const content = readMarkdown(dir, "intent.md");
    expect(content).toBe("# Intent\nTest content");
  });

  it("returns null for missing file", () => {
    const tmp = makeTmp();
    expect(readMarkdown(tmp, "nonexistent.md")).toBeNull();
  });
});

describe("listChanges", () => {
  it("lists created change directories", () => {
    const tmp = makeTmp();
    ensureDirectoryStructure(tmp);
    createChangeDir(tmp, "alpha");
    createChangeDir(tmp, "beta");
    const changes = listChanges(tmp);
    expect(changes).toContain("alpha");
    expect(changes).toContain("beta");
  });

  it("returns empty array when no changes exist", () => {
    const tmp = makeTmp();
    expect(listChanges(tmp)).toEqual([]);
  });
});

describe("changeExists", () => {
  it("returns true for existing change", () => {
    const tmp = makeTmp();
    ensureDirectoryStructure(tmp);
    createChangeDir(tmp, "my-change");
    expect(changeExists(tmp, "my-change")).toBe(true);
  });

  it("returns false for non-existing change", () => {
    const tmp = makeTmp();
    ensureDirectoryStructure(tmp);
    expect(changeExists(tmp, "no-such-change")).toBe(false);
  });
});
