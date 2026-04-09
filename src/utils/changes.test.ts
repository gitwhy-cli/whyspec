import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveChange } from "./changes.js";

describe("resolveChange", () => {
  it("resolves a slugified user input to an existing change folder", () => {
    const root = mkdtempSync(join(tmpdir(), "whyspec-changes-test-"));
    const gitwhyDir = join(root, ".gitwhy");
    const changePath = join(gitwhyDir, "changes", "add-auth");
    mkdirSync(changePath, { recursive: true });

    expect(resolveChange(gitwhyDir, "Add Auth")).toEqual({
      name: "add-auth",
      path: changePath,
    });

    rmSync(root, { recursive: true, force: true });
  });

  it("rejects path traversal attempts", () => {
    const root = mkdtempSync(join(tmpdir(), "whyspec-changes-test-"));
    const gitwhyDir = join(root, ".gitwhy");
    mkdirSync(join(gitwhyDir, "changes"), { recursive: true });

    expect(() => resolveChange(gitwhyDir, "../outside")).toThrow(/invalid change name/i);
    expect(() => resolveChange(gitwhyDir, "../../etc/passwd")).toThrow(/invalid change name/i);

    rmSync(root, { recursive: true, force: true });
  });
});
