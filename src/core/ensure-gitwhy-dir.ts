import { existsSync } from "node:fs";
import {
  createGitwhyDir,
  detectProjectName,
  writeConfigYaml,
} from "../commands/init.js";
import { storageDirPath } from "./storage-root.js";

export function ensureGitwhyDir(root: string): void {
  const gitwhyDir = storageDirPath(root);
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
  process.stderr.write(`Auto-initialized ${gitwhyDir.replace(`${root}/`, "")}/\n`);
}
