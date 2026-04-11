import { existsSync } from "node:fs";
import { join } from "node:path";

export const PRIMARY_STORAGE_DIR = "whyspec";
export const LEGACY_STORAGE_DIR = "gitwhy";
export const OLDEST_LEGACY_STORAGE_DIR = ".gitwhy";
export const STORAGE_DIR_CANDIDATES = [
  PRIMARY_STORAGE_DIR,
  LEGACY_STORAGE_DIR,
  OLDEST_LEGACY_STORAGE_DIR,
] as const;

export function resolveStorageDirName(repoRoot: string): string {
  for (const candidate of STORAGE_DIR_CANDIDATES) {
    if (existsSync(join(repoRoot, candidate))) {
      return candidate;
    }
  }
  return PRIMARY_STORAGE_DIR;
}

export function storageDirPath(repoRoot: string): string {
  return join(repoRoot, resolveStorageDirName(repoRoot));
}

export function relativeStoragePath(repoRoot: string, ...segments: string[]): string {
  return [resolveStorageDirName(repoRoot), ...segments].join("/");
}
