/**
 * Change folder operations for .gitwhy/changes/ directories.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join, normalize, relative, sep } from "node:path";
import { slugify } from "./slugify.js";

export interface ResolvedChange {
  name: string;
  path: string;
}

function normalizeChangeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Invalid change name.");
  }

  const normalizedPath = normalize(trimmed);
  if (
    normalizedPath === ".." ||
    normalizedPath.startsWith(`..${sep}`) ||
    normalizedPath.includes(`${sep}..${sep}`) ||
    normalizedPath.endsWith(`${sep}..`) ||
    normalizedPath.startsWith(sep)
  ) {
    throw new Error(`Invalid change name "${name}".`);
  }

  return slugify(trimmed);
}

/**
 * List all change folder names in .gitwhy/changes/.
 */
export function listChanges(gitwhyDir: string): string[] {
  const changesDir = join(gitwhyDir, "changes");
  if (!existsSync(changesDir)) return [];
  return readdirSync(changesDir).filter((entry) => {
    const full = join(changesDir, entry);
    return statSync(full).isDirectory();
  });
}

/**
 * Resolve a change by name, or auto-detect if only one exists.
 * - If name provided: validate the folder exists.
 * - If no name + exactly 1 change: auto-select it.
 * - If no name + 0 or multiple changes: throw with guidance.
 */
export function resolveChange(
  gitwhyDir: string,
  name?: string,
): ResolvedChange {
  const changesDir = join(gitwhyDir, "changes");

  if (name) {
    const normalizedName = normalizeChangeName(name);
    const changePath = join(changesDir, normalizedName);
    const rel = relative(changesDir, changePath);
    if (rel.startsWith("..") || rel === "") {
      throw new Error(`Invalid change name "${name}".`);
    }
    if (!existsSync(changePath)) {
      throw new Error(
        `Change "${normalizedName}" not found. Run \`whyspec plan "${normalizedName}"\` first.`,
      );
    }
    return { name: normalizedName, path: changePath };
  }

  const changes = listChanges(gitwhyDir);
  if (changes.length === 0) {
    throw new Error(
      "No changes found. Run `whyspec plan <name>` to create one.",
    );
  }
  if (changes.length === 1) {
    return { name: changes[0], path: join(changesDir, changes[0]) };
  }
  throw new Error(
    `Multiple changes found. Specify one:\n${changes.map((c) => `  - ${c}`).join("\n")}`,
  );
}
