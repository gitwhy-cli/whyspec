import { existsSync } from "node:fs";
import { join } from "node:path";

export const PRIMARY_STORAGE_DIR = "gitwhy";
export const LEGACY_STORAGE_DIR = ".gitwhy";

export function resolveStorageDirName(repoRoot: string): string {
  if (existsSync(join(repoRoot, PRIMARY_STORAGE_DIR))) {
    return PRIMARY_STORAGE_DIR;
  }
  if (existsSync(join(repoRoot, LEGACY_STORAGE_DIR))) {
    return LEGACY_STORAGE_DIR;
  }
  return PRIMARY_STORAGE_DIR;
}

export function storageDirPath(repoRoot: string): string {
  return join(repoRoot, resolveStorageDirName(repoRoot));
}

export function relativeStoragePath(repoRoot: string, ...segments: string[]): string {
  return [resolveStorageDirName(repoRoot), ...segments].join("/");
}
