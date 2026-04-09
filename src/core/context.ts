/**
 * Context generation for WhySpec capture command.
 * - Context ID: ctx_ + 8-char alphanumeric
 * - SaaS XML format (GitWhy compatible)
 * - Decision Bridge extraction from design.md
 */

import { randomBytes } from "node:crypto";
import { statSync } from "node:fs";
import { contextTemplate } from "./templates.js";

/**
 * Generate a context ID: ctx_ + 8 random alphanumeric characters.
 * Matches GitWhy convention (FR-20).
 */
export function generateContextId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(8);
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return `ctx_${id}`;
}

/**
 * Render the SaaS-compatible XML context template.
 */
export function renderContextXml(): string {
  return contextTemplate();
}

/**
 * Extract decision items from design.md's "## Decisions to Make" section.
 * Parses checkbox lines: `- [ ] description` and `- [x] description`.
 * Returns the description text of each decision item.
 */
export function extractDecisions(designContent: string): string[] {
  const lines = designContent.split("\n");
  const decisions: string[] = [];
  let inSection = false;

  for (const line of lines) {
    // Start capturing when we hit the Decisions to Make heading
    if (/^##\s+Decisions to Make/i.test(line)) {
      inSection = true;
      continue;
    }
    // Stop at the next heading
    if (inSection && /^##\s/.test(line)) {
      break;
    }
    // Capture checkbox items within the section
    if (inSection) {
      const match = line.match(/^-\s+\[[ xX]\]\s+(.+)/);
      if (match) {
        decisions.push(match[1].trim());
      }
    }
  }

  return decisions;
}

/**
 * Get the creation time of a change folder (used for commit range detection).
 */
export function getChangeFolderCreatedAt(changePath: string): Date {
  const stat = statSync(changePath);
  return stat.birthtime;
}
