import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  readConfig,
  writeConfig,
  defaultConfigYaml,
  ConfigSchema,
} from "./config.js";

function makeTmpRepo(): string {
  const tmp = mkdtempSync(join(tmpdir(), "whyspec-config-test-"));
  mkdirSync(join(tmp, ".gitwhy"), { recursive: true });
  return tmp;
}

describe("readConfig", () => {
  it("returns defaults when config file is missing", () => {
    const tmp = mkdtempSync(join(tmpdir(), "whyspec-config-test-"));
    const config = readConfig(tmp);
    expect(config.version).toBe("1.0");
    expect(config.telemetry).toBe(true);
    expect(config.tools).toEqual(["claude-code"]);
  });

  it("reads and validates a written config", () => {
    const tmp = makeTmpRepo();
    writeConfig(tmp, { project: { name: "test-project", description: "A test" } });
    const config = readConfig(tmp);
    expect(config.project.name).toBe("test-project");
    expect(config.project.description).toBe("A test");
  });
});

describe("writeConfig", () => {
  it("roundtrips config through write/read", () => {
    const tmp = makeTmpRepo();
    const input = {
      version: "1.0",
      project: { name: "my-app", description: "desc" },
      telemetry: false,
      default_agent: "cursor",
      tools: ["cursor", "copilot"],
      context: "We use React + TypeScript",
      rules: "Always write tests first",
    };
    writeConfig(tmp, input);
    const config = readConfig(tmp);
    expect(config.telemetry).toBe(false);
    expect(config.default_agent).toBe("cursor");
    expect(config.tools).toEqual(["cursor", "copilot"]);
    expect(config.context).toBe("We use React + TypeScript");
    expect(config.rules).toBe("Always write tests first");
  });
});

describe("defaultConfigYaml", () => {
  it("produces parseable YAML string", () => {
    const yaml = defaultConfigYaml("my-project");
    expect(yaml).toContain("my-project");
    expect(typeof yaml).toBe("string");
  });

  it("works with empty project name", () => {
    const yaml = defaultConfigYaml();
    expect(yaml).toBeTruthy();
  });
});

describe("ConfigSchema", () => {
  it("applies defaults for empty object", () => {
    const config = ConfigSchema.parse({});
    expect(config.version).toBe("1.0");
    expect(config.default_agent).toBe("claude-code");
  });

  it("rejects invalid types", () => {
    expect(() =>
      ConfigSchema.parse({ version: 123 })
    ).toThrow();
  });
});
