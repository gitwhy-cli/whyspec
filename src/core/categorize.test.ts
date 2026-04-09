import { describe, it, expect } from "vitest";
import { autoCategorize, classifyPath } from "./categorize.js";

describe("classifyPath", () => {
  it("classifies test files as testing", () => {
    expect(classifyPath("src/utils/slugify.test.ts")).toBe("testing");
    expect(classifyPath("app_test.go")).toBe("testing");
    expect(classifyPath("component.spec.tsx")).toBe("testing");
  });

  it("classifies markdown as documentation", () => {
    expect(classifyPath("README.md")).toBe("documentation");
    expect(classifyPath("docs/guide.md")).toBe("documentation");
  });

  it("classifies Dockerfile as infrastructure", () => {
    expect(classifyPath("Dockerfile")).toBe("infrastructure");
    expect(classifyPath("deploy/Dockerfile")).toBe("infrastructure");
  });

  it("classifies auth directory as authentication", () => {
    expect(classifyPath("src/auth/login.ts")).toBe("authentication");
    expect(classifyPath("internal/auth/middleware.go")).toBe("authentication");
  });

  it("classifies database directory", () => {
    expect(classifyPath("src/db/schema.ts")).toBe("database");
    expect(classifyPath("migrations/001.sql")).toBe("database");
  });

  it("classifies API directory", () => {
    expect(classifyPath("src/api/handlers.ts")).toBe("api-design");
    expect(classifyPath("routes/users.ts")).toBe("api-design");
  });

  it("classifies frontend directory", () => {
    expect(classifyPath("components/Button.tsx")).toBe("frontend");
    expect(classifyPath("frontend/App.tsx")).toBe("frontend");
  });

  it("returns empty string for unrecognized paths", () => {
    expect(classifyPath("src/utils/helpers.ts")).toBe("");
    expect(classifyPath("lib/core.go")).toBe("");
  });
});

describe("autoCategorize", () => {
  it("detects authentication domain from file paths", () => {
    const result = autoCategorize("Auth fix", ["src/auth/login.ts"]);
    expect(result.domain).toBe("authentication");
    expect(result.topic).toBe("auth-fix");
  });

  it("detects testing domain", () => {
    const result = autoCategorize("Add tests", [
      "app.test.ts",
      "util.test.ts",
    ]);
    expect(result.domain).toBe("testing");
  });

  it("detects documentation domain", () => {
    const result = autoCategorize("Update docs", ["README.md"]);
    expect(result.domain).toBe("documentation");
  });

  it("uses majority vote with mixed files", () => {
    const result = autoCategorize("Mixed change", [
      "src/auth/login.ts",
      "src/db/schema.ts",
      "src/auth/session.ts",
    ]);
    expect(result.domain).toBe("authentication");
  });

  it('returns "uncategorized" when no files match', () => {
    const result = autoCategorize("Unknown", ["random/file.ts"]);
    expect(result.domain).toBe("uncategorized");
  });

  it('returns "uncategorized" with empty file list', () => {
    const result = autoCategorize("Something", []);
    expect(result.domain).toBe("uncategorized");
  });

  it("topic is always the slugified title", () => {
    const result = autoCategorize("Hello World!", ["src/auth/x.ts"]);
    expect(result.topic).toBe("hello-world");
  });

  it('topic defaults to "general" for empty title', () => {
    const result = autoCategorize("", ["src/auth/x.ts"]);
    expect(result.topic).toBe("general");
  });
});
