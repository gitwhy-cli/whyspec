import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import YAML from "yaml";

/**
 * config.yaml reader with Zod validation.
 */

const ConfigSchema = z.object({
  version: z.string().default("1.0"),
  project: z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  context: z.string().optional(),
  rules: z.string().optional(),
  telemetry: z.boolean().default(true),
  default_agent: z.string().default("claude-code"),
  tools: z.array(z.string()).default([]),
});

export type WhySpecConfig = z.infer<typeof ConfigSchema>;

const DEFAULT_CONFIG: WhySpecConfig = {
  version: "1.0",
  project: { name: "", description: "" },
  context: "",
  rules: "",
  telemetry: true,
  default_agent: "claude-code",
  tools: [],
};

/**
 * Read and validate config.yaml from a .gitwhy/ directory.
 * Returns default config if file doesn't exist.
 */
export function readConfig(gitwhyDir: string): WhySpecConfig {
  const configPath = join(gitwhyDir, "config.yaml");
  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }
  try {
    const raw = readFileSync(configPath, "utf-8");
    const parsed = YAML.parse(raw) ?? {};
    return ConfigSchema.parse(parsed);
  } catch {
    return DEFAULT_CONFIG;
  }
}
