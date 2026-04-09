import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { templateCommand } from "../template.js";

describe("templateCommand", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("returns intent template as JSON", async () => {
    await templateCommand("intent", { json: true });
    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.type).toBe("intent");
    expect(output.content).toContain("## Why This Change Exists");
    expect(output.content).toContain("## Decisions to Make");
  });

  it("returns design template as JSON", async () => {
    await templateCommand("design", { json: true });
    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.type).toBe("design");
    expect(output.content).toContain("## Approach");
    expect(output.content).toContain("## Trade-off Matrix");
  });

  it("returns tasks template as JSON", async () => {
    await templateCommand("tasks", { json: true });
    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.type).toBe("tasks");
    expect(output.content).toContain("## Verification");
    expect(output.content).toContain("## Tasks");
  });

  it("returns context template as JSON", async () => {
    await templateCommand("context", { json: true });
    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.type).toBe("context");
    expect(output.content).toContain("<context>");
    expect(output.content).toContain("<reasoning>");
  });

  it("returns debug template as JSON", async () => {
    await templateCommand("debug", { json: true });
    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.type).toBe("debug");
    expect(output.content).toContain("## Symptoms");
    expect(output.content).toContain("## Hypotheses");
  });

  it("prints raw content in non-JSON mode", async () => {
    await templateCommand("intent", { json: false });
    const output = logSpy.mock.calls[0][0];
    expect(output).toContain("## Why This Change Exists");
    expect(() => JSON.parse(output)).toThrow(); // Not JSON
  });

  it("throws on invalid template type", async () => {
    await expect(templateCommand("invalid", { json: false })).rejects.toThrow(
      'Invalid template type "invalid"',
    );
  });

  it("lists valid types in error message", async () => {
    await expect(templateCommand("wrong", { json: false })).rejects.toThrow(
      "intent, design, tasks, context, debug",
    );
  });
});
