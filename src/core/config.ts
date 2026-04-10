/**
 * WhySpec config.yaml reader/writer with Zod validation.
 * Reads/writes WhySpec config.yaml in the project root.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import YAML from "yaml";
import { storageDirPath } from "./storage-root.js";

/** Zod schema for WhySpec config.yaml */
export const ConfigSchema = z.object({
  version: z.string().default("1.0"),
  project: z
    .object({
      name: z.string().default(""),
      description: z.string().default(""),
    })
    .default(() => ({ name: "", description: "" })),
  telemetry: z.boolean().default(true),
  default_agent: z.string().default("claude-code"),
  tools: z.array(z.string()).default(["claude-code"]),
  context: z.string().default(""),
  rules: z.string().default(""),
});

export type WhySpecConfig = z.infer<typeof ConfigSchema>;

const CONFIG_FILE = "config.yaml";

function configPath(repoRoot: string): string {
  return join(storageDirPath(repoRoot), CONFIG_FILE);
}

/** Reads and validates WhySpec config.yaml. Returns defaults if file doesn't exist. */
export function readConfig(repoRoot: string): WhySpecConfig {
  const path = configPath(repoRoot);
  if (!existsSync(path)) {
    return ConfigSchema.parse({});
  }

  const raw = readFileSync(path, "utf-8");
  const parsed = YAML.parse(raw) ?? {};
  return ConfigSchema.parse(parsed);
}

/** Writes a validated config to the active WhySpec config.yaml path. */
export function writeConfig(repoRoot: string, config: Partial<WhySpecConfig>): void {
  const validated = ConfigSchema.parse(config);
  const yamlStr = YAML.stringify(validated);
  mkdirSync(storageDirPath(repoRoot), { recursive: true });
  writeFileSync(configPath(repoRoot), yamlStr, "utf-8");
}

/** Returns the default config as a YAML string (for init). */
export function defaultConfigYaml(projectName = ""): string {
  const config = ConfigSchema.parse({
    project: { name: projectName },
  });
  return YAML.stringify(config);
}
