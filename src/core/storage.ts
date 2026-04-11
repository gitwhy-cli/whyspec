/**
 * Storage module for WhySpec.
 * Manages WhySpec storage directory structure, reads/writes markdown files,
 * generates context IDs.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { storageDirPath } from "./storage-root.js";

const CHANGES_DIR = "changes";
const ARCHIVE_DIR = "archive";
const DEBUG_DIR = "debug";

/**
 * Generates a context ID: ctx_ + 8-char alphanumeric.
 * Uses crypto.randomBytes for randomness.
 */
export function generateContextId(): string {
  const bytes = randomBytes(4);
  return `ctx_${bytes.toString("hex")}`;
}

/** Returns the active WhySpec storage directory path for a repo root. */
export function gitwhyDir(repoRoot: string): string {
  return storageDirPath(repoRoot);
}

/** Returns the changes directory path. */
export function changesDir(repoRoot: string): string {
  return join(gitwhyDir(repoRoot), CHANGES_DIR);
}

/**
 * Ensures the WhySpec directory structure exists:
 *   whyspec/ 
 *   ├── changes/
 *   ├── archive/
 *   └── debug/
 */
export function ensureDirectoryStructure(repoRoot: string): void {
  const rootDir = gitwhyDir(repoRoot);
  const dirs = [
    rootDir,
    join(rootDir, CHANGES_DIR),
    join(rootDir, ARCHIVE_DIR),
    join(rootDir, DEBUG_DIR),
  ];
  for (const dir of dirs) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Creates a change directory under changes/<name>/.
 * Returns the created path.
 */
export function createChangeDir(repoRoot: string, changeName: string): string {
  const dir = join(changesDir(repoRoot), changeName);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** Reads a markdown file from a change directory. Returns null if not found. */
export function readMarkdown(changeDir: string, filename: string): string | null {
  const path = join(changeDir, filename);
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

/** Writes a markdown file to a change directory. */
export function writeMarkdown(changeDir: string, filename: string, content: string): void {
  writeFileSync(join(changeDir, filename), content, "utf-8");
}

/** Lists all change names in changes/. */
export function listChanges(repoRoot: string): string[] {
  const dir = changesDir(repoRoot);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

/** Checks if a specific change directory exists. */
export function changeExists(repoRoot: string, changeName: string): boolean {
  return existsSync(join(changesDir(repoRoot), changeName));
}
