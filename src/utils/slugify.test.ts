import { describe, it, expect } from "vitest";
import { slugify } from "./slugify.js";

describe("slugify", () => {
  it("converts spaces to hyphens and lowercases", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("handles multiple words", () => {
    expect(slugify("add user auth")).toBe("add-user-auth");
  });

  it("removes special characters", () => {
    expect(slugify("Hello! @World#")).toBe("hello-world");
  });

  it('returns "general" for empty string', () => {
    expect(slugify("")).toBe("general");
  });

  it('returns "general" for whitespace-only input', () => {
    expect(slugify("   ")).toBe("general");
  });

  it('returns "general" for hyphens-only input', () => {
    expect(slugify("---")).toBe("general");
  });

  it("lowercases already-slug input", () => {
    expect(slugify("Already-Slug")).toBe("already-slug");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("-hello-")).toBe("hello");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("hello   world")).toBe("hello---world");
  });
});
