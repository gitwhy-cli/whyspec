import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import YAML from "yaml";
import { ensureGitwhyDir } from "./ensure-gitwhy-dir.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "whyspec-ensure-gitwhy-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("ensureGitwhyDir", () => {
  it("creates canonical whyspec structure and default config when missing", () => {
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ name: "@gitwhy-cli/whyspec" }),
      "utf-8",
    );
    const stderrSpy = vi.spyOn(process.stderr, "write").mockReturnValue(true);

    ensureGitwhyDir(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, "whyspec"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "whyspec", "changes"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "whyspec", "archive"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "whyspec", "debug"))).toBe(true);

    const rawConfig = fs.readFileSync(path.join(tmpDir, "whyspec", "config.yaml"), "utf-8");
    const config = YAML.parse(rawConfig);
    expect(config.project.name).toBe("whyspec");
    expect(config.tools).toEqual(["claude-code"]);
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    expect(stderrSpy).toHaveBeenCalledWith("Auto-initialized whyspec/\n");

    stderrSpy.mockRestore();
  });

  it("is a no-op when whyspec already exists", () => {
    fs.mkdirSync(path.join(tmpDir, "whyspec"), { recursive: true });
    const stderrSpy = vi.spyOn(process.stderr, "write").mockReturnValue(true);

    expect(() => ensureGitwhyDir(tmpDir)).not.toThrow();
    expect(fs.existsSync(path.join(tmpDir, "whyspec", "config.yaml"))).toBe(false);
    expect(stderrSpy).not.toHaveBeenCalled();

    stderrSpy.mockRestore();
  });
});
