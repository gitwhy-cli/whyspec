import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  createGitwhyDir,
  detectProjectName,
  writeConfigYaml,
} from "../commands/init.js";

export function ensureGitwhyDir(root: string): void {
  const gitwhyDir = join(root, ".gitwhy");
  if (existsSync(gitwhyDir)) {
    return;
  }

  createGitwhyDir(root);
  writeConfigYaml(root, {
    projectName: detectProjectName(root),
    projectDescription: "",
    tools: ["claude-code"],
    telemetry: process.env.WHYSPEC_TELEMETRY !== "0",
  });
  process.stderr.write("Auto-initialized .gitwhy/\n");
}
