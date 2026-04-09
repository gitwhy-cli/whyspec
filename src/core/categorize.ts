/**
 * Domain/topic detection from file paths.
 * Ported from GitWhy Go: internal/storage/categorize.go
 *
 * AutoCategorize uses majority-vote across file paths to determine
 * a domain, and slugifies the title to produce a topic.
 */

import { slugify } from "../utils/slugify.js";

interface CategoryRule {
  pattern: RegExp;
  domain: string;
}

/**
 * Rules ordered: file-suffix patterns first (most specific),
 * then directory-prefix patterns.
 */
const categoryRules: CategoryRule[] = [
  // File-suffix rules first (most specific)
  { pattern: /_test\.go$/, domain: "testing" },
  { pattern: /\.test\.(ts|tsx|js|jsx)$/, domain: "testing" },
  { pattern: /\.spec\.(ts|tsx|js|jsx)$/, domain: "testing" },
  { pattern: /\.md$/, domain: "documentation" },
  { pattern: /(^|\/)Dockerfile$/, domain: "infrastructure" },
  // Directory-prefix rules
  { pattern: /^(src\/auth|internal\/auth|auth)\//, domain: "authentication" },
  { pattern: /^(src\/db|internal\/db|db|migrations)\//, domain: "database" },
  { pattern: /^(src\/api|api|routes)\//, domain: "api-design" },
  { pattern: /^(src\/ui|web|frontend|components)\//, domain: "frontend" },
  { pattern: /^(test|tests)\//, domain: "testing" },
  { pattern: /^docs\//, domain: "documentation" },
  { pattern: /^(infra|deploy|\.github)\//, domain: "infrastructure" },
];

/** Classifies a single file path into a domain, or empty string if no match. */
function classifyPath(filePath: string): string {
  for (const rule of categoryRules) {
    if (rule.pattern.test(filePath)) {
      return rule.domain;
    }
  }
  return "";
}

/**
 * AutoCategorize determines a domain and topic from a title and file paths.
 *
 * Domain: chosen by majority vote across all file paths. "uncategorized" if none match.
 * Topic: derived from title via slugify. "general" if title is empty.
 */
export function autoCategorize(
  title: string,
  filePaths: string[]
): { domain: string; topic: string } {
  const topic = slugify(title);

  if (!filePaths || filePaths.length === 0) {
    return { domain: "uncategorized", topic };
  }

  // Count votes for each domain
  const votes: Record<string, number> = {};
  for (const fp of filePaths) {
    const d = classifyPath(fp);
    if (d) {
      votes[d] = (votes[d] ?? 0) + 1;
    }
  }

  if (Object.keys(votes).length === 0) {
    return { domain: "uncategorized", topic };
  }

  // Pick domain with highest vote count
  let bestDomain = "";
  let bestCount = 0;
  for (const [domain, count] of Object.entries(votes)) {
    if (count > bestCount) {
      bestDomain = domain;
      bestCount = count;
    }
  }

  return { domain: bestDomain, topic };
}

export { classifyPath, categoryRules };
