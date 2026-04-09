import { describe, it, expect } from "vitest";
import {
  intentTemplate,
  designTemplate,
  tasksTemplate,
  contextTemplate,
  debugTemplate,
  getTemplate,
} from "./templates.js";

describe("intentTemplate", () => {
  it("contains the intent header with change name", () => {
    const t = intentTemplate("add-auth");
    expect(t).toContain("# Intent: add-auth");
  });

  it("contains required sections", () => {
    const t = intentTemplate("test");
    expect(t).toContain("Why This Change Exists");
    expect(t).toContain("What It Enables");
    expect(t).toContain("Decisions to Make");
    expect(t).toContain("Constraints");
    expect(t).toContain("Success Looks Like");
  });
});

describe("designTemplate", () => {
  it("contains the design header", () => {
    const t = designTemplate("add-auth");
    expect(t).toContain("# Design: add-auth");
  });

  it("contains trade-off matrix table", () => {
    const t = designTemplate("test");
    expect(t).toContain("| Option | Pros | Cons | Decision |");
  });

  it("contains architecture section", () => {
    const t = designTemplate("test");
    expect(t).toContain("Architecture");
  });
});

describe("tasksTemplate", () => {
  it("contains the tasks header", () => {
    const t = tasksTemplate("add-auth");
    expect(t).toContain("# Tasks: add-auth");
  });

  it("contains verification section (goal-backward)", () => {
    const t = tasksTemplate("test");
    expect(t).toContain("Verification");
  });
});

describe("contextTemplate", () => {
  it("produces valid XML with all required tags", () => {
    const t = contextTemplate();
    expect(t).toContain("<context>");
    expect(t).toContain("</context>");
    expect(t).toContain("<title>");
    expect(t).toContain("<story>");
    expect(t).toContain("<reasoning>");
    expect(t).toContain("<decisions>");
    expect(t).toContain("<rejected>");
    expect(t).toContain("<tradeoffs>");
    expect(t).toContain("<files>");
    expect(t).toContain("<agent>");
    expect(t).toContain("<tags>");
    expect(t).toContain("<verification>");
    expect(t).toContain("<risks>");
  });

  it("uses provided title", () => {
    const t = contextTemplate({ title: "Add user authentication" });
    expect(t).toContain("<title>Add user authentication</title>");
  });

  it("uses provided agent", () => {
    const t = contextTemplate({ agent: "cursor (gpt-4o)" });
    expect(t).toContain("<agent>cursor (gpt-4o)</agent>");
  });

  it("uses provided tags", () => {
    const t = contextTemplate({ tags: "auth, security" });
    expect(t).toContain("<tags>auth, security</tags>");
  });
});

describe("debugTemplate", () => {
  it("contains the debug header", () => {
    const t = debugTemplate("login-crash");
    expect(t).toContain("# Debug: login-crash");
  });

  it("contains hypotheses section", () => {
    const t = debugTemplate("test");
    expect(t).toContain("Hypotheses");
    expect(t).toContain("Hypothesis:");
    expect(t).toContain("Disproof:");
  });

  it("contains root cause and fix sections", () => {
    const t = debugTemplate("test");
    expect(t).toContain("Root Cause");
    expect(t).toContain("Fix");
    expect(t).toContain("Prevention");
  });
});

describe("getTemplate", () => {
  it("dispatches to intentTemplate", () => {
    const t = getTemplate("intent", "test");
    expect(t).toContain("# Intent: test");
  });

  it("dispatches to designTemplate", () => {
    const t = getTemplate("design", "test");
    expect(t).toContain("# Design: test");
  });

  it("dispatches to tasksTemplate", () => {
    const t = getTemplate("tasks", "test");
    expect(t).toContain("# Tasks: test");
  });

  it("dispatches to contextTemplate", () => {
    const t = getTemplate("context");
    expect(t).toContain("<context>");
  });

  it("dispatches to debugTemplate", () => {
    const t = getTemplate("debug", "bug");
    expect(t).toContain("# Debug: bug");
  });
});
