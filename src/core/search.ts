/**
 * Search engine for WhySpec.
 * Ported from GitWhy Go: internal/storage/tree.go
 *   - splitMarkdownSections (tree.go:786-822)
 *   - computeSearchScore (tree.go:736-781)
 *   - SearchContexts (tree.go:648-732)
 *
 * Searches all .md files in .gitwhy/changes/ (ctx_*.md, intent.md, design.md)
 * using weighted section scoring.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { changesDir } from "./storage.js";
import { autoCategorize } from "./categorize.js";

export interface SearchResult {
  id: string;
  title: string;
  change_name: string;
  domain: string;
  score: number;
  matched_sections: string[];
  path: string;
  snippet: string;
}

/**
 * Split a markdown document into named sections.
 * Returns a map keyed by lowercase section name (H2 headers).
 * The special key "title" holds the first H1 line text.
 *
 * Ported from tree.go:splitMarkdownSections (lines 786-822).
 */
export function splitMarkdownSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = content.split("\n");

  let currentSection = "";
  let sectionLines: string[] = [];

  for (const line of lines) {
    // Capture the title (first H1).
    if (!("title" in sections) && line.startsWith("# ")) {
      sections["title"] = line.slice(2);
      continue;
    }

    // Detect H2 section headers.
    if (line.startsWith("## ")) {
      // Flush the previous section.
      if (currentSection) {
        sections[currentSection] = sectionLines.join("\n");
      }
      currentSection = line.slice(3).toLowerCase();
      sectionLines = [];
      continue;
    }

    if (currentSection) {
      sectionLines.push(line);
    }
  }

  // Flush the last section.
  if (currentSection) {
    sections[currentSection] = sectionLines.join("\n");
  }

  return sections;
}

/**
 * Compute a relevance score for a document based on which markdown sections
 * contain the query string (case-insensitive).
 *
 * Ported from tree.go:computeSearchScore (lines 736-781).
 * Weights: title=100, prompt=50, reasoning=30, "what was done"=30, files=20, fallback=10.
 */
export function computeSearchScore(
  content: string,
  lowerQuery: string,
): { score: number; matchedSections: string[] } {
  const sections = splitMarkdownSections(content);
  let score = 0;
  const matchedSections: string[] = [];

  // Title match: first # line (100 points).
  if (sections["title"] && sections["title"].toLowerCase().includes(lowerQuery)) {
    score += 100;
    matchedSections.push("title");
  }

  // Prompt section (50 points).
  if (sections["prompt"] && sections["prompt"].toLowerCase().includes(lowerQuery)) {
    score += 50;
    matchedSections.push("prompt");
  }

  // Reasoning section (30 points).
  if (sections["reasoning"] && sections["reasoning"].toLowerCase().includes(lowerQuery)) {
    score += 30;
    matchedSections.push("reasoning");
  }

  // What Was Done section (30 points).
  if (sections["what was done"] && sections["what was done"].toLowerCase().includes(lowerQuery)) {
    score += 30;
    matchedSections.push("what was done");
  }

  // Files section (20 points).
  if (sections["files"] && sections["files"].toLowerCase().includes(lowerQuery)) {
    score += 20;
    matchedSections.push("files");
  }

  // Fallback: if no specific section matched but the query IS in the content, give 10 points.
  if (score === 0 && content.toLowerCase().includes(lowerQuery)) {
    score += 10;
    matchedSections.push("content");
  }

  return { score, matchedSections };
}

/**
 * Walk a directory recursively and collect all .md file paths.
 */
function walkMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkMarkdownFiles(fullPath));
    } else if (
      entry.name.startsWith("ctx_") && entry.name.endsWith(".md") ||
      entry.name === "intent.md" ||
      entry.name === "design.md"
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Extract a snippet from the highest-scoring section content.
 */
function extractSnippet(content: string, lowerQuery: string, maxLen = 150): string {
  const lower = content.toLowerCase();
  const idx = lower.indexOf(lowerQuery);
  if (idx === -1) return content.slice(0, maxLen).trim();

  // Show context around the match.
  const start = Math.max(0, idx - 40);
  const end = Math.min(content.length, idx + lowerQuery.length + maxLen - 40);
  let snippet = content.slice(start, end).replace(/\n/g, " ").trim();
  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";
  return snippet;
}

/**
 * Extract the title from markdown content (first H1 line).
 */
function extractTitle(content: string): string {
  const match = content.match(/^# (.+)/m);
  return match ? match[1].trim() : "";
}

/**
 * Extract file paths listed in a <files> tag or ## Files section.
 */
function extractFilePaths(content: string): string[] {
  const paths: string[] = [];

  // Try XML <files> tag first.
  const filesMatch = content.match(/<files>([\s\S]*?)<\/files>/);
  if (filesMatch) {
    const lines = filesMatch[1].split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      // Format: path/to/file — action — description
      const parts = line.split(/\s+—\s+/);
      if (parts[0]) paths.push(parts[0].trim());
    }
    return paths;
  }

  // Try ## Files section.
  const sections = splitMarkdownSections(content);
  if (sections["files"]) {
    const lines = sections["files"].split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const parts = line.split(/\s+—\s+/);
      if (parts[0]) paths.push(parts[0].trim());
    }
  }

  return paths;
}

/**
 * Search all .md files in .gitwhy/changes/ for a query string.
 * Returns scored results sorted by score descending, then date descending.
 *
 * Searches ctx_*.md, intent.md, and design.md (FR-25).
 * Supports domain filtering and result limit.
 */
export function searchChanges(
  repoRoot: string,
  query: string,
  options?: { domain?: string; limit?: number },
): SearchResult[] {
  if (!query) return [];

  const dir = changesDir(repoRoot);
  if (!existsSync(dir)) return [];

  const lowerQuery = query.toLowerCase();
  const limit = options?.limit ?? 10;

  interface ScoredResult {
    result: SearchResult;
    mtime: Date;
  }

  const results: ScoredResult[] = [];

  // Walk all change directories.
  const changeDirs = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const changeName of changeDirs) {
    const changeDir = join(dir, changeName);
    const mdFiles = walkMarkdownFiles(changeDir);

    for (const filePath of mdFiles) {
      const content = readFileSync(filePath, "utf-8");
      const lowerContent = content.toLowerCase();

      // Only proceed if the query matches somewhere in the file.
      if (!lowerContent.includes(lowerQuery)) continue;

      const { score, matchedSections } = computeSearchScore(content, lowerQuery);
      const title = extractTitle(content) || changeName;
      const filePaths = extractFilePaths(content);
      const { domain } = autoCategorize(title, filePaths);

      // Apply domain filter if specified.
      if (options?.domain && domain !== options.domain) continue;

      // Derive ID from filename (without .md extension). Use path.basename for cross-platform safety.
      const id = basename(filePath, ".md");

      const snippet = extractSnippet(content, lowerQuery);
      const relPath = relative(repoRoot, filePath);
      const mtime = statSync(filePath).mtime;

      results.push({
        result: {
          id,
          title,
          change_name: changeName,
          domain,
          score,
          matched_sections: matchedSections,
          path: relPath,
          snippet,
        },
        mtime,
      });
    }
  }

  // Sort by score descending, then by date descending for ties.
  results.sort((a, b) => {
    if (a.result.score !== b.result.score) return b.result.score - a.result.score;
    return b.mtime.getTime() - a.mtime.getTime();
  });

  return results.slice(0, limit).map((r) => r.result);
}
