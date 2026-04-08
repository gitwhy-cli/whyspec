/**
 * Slugify converts a string to a URL-friendly slug.
 * Ported from GitWhy Go: internal/storage/categorize.go
 *
 * - Lowercase
 * - Spaces replaced with hyphens
 * - Special characters removed (only a-z, 0-9, hyphens kept)
 * - Leading/trailing hyphens trimmed
 * - Returns "general" for empty input
 */

const SLUG_RE = /[^a-z0-9-]/g;

export function slugify(input: string): string {
  if (!input) return "general";

  let s = input.toLowerCase();
  s = s.replace(/ /g, "-");
  s = s.replace(SLUG_RE, "");
  s = s.replace(/^-+|-+$/g, "");

  return s || "general";
}
