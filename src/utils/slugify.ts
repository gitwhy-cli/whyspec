/**
 * Slugify — ported from GitWhy Go implementation (internal/storage/categorize.go).
 * Converts a string to a URL-friendly slug: lowercase, spaces replaced with hyphens,
 * special characters removed, leading/trailing hyphens trimmed.
 */

const slugifyRe = /[^a-z0-9-]/g;

export function slugify(s: string): string {
  if (!s || !s.trim()) {
    return "general";
  }
  let result = s.toLowerCase();
  result = result.replace(/\s+/g, "-");
  result = result.replace(slugifyRe, "");
  result = result.replace(/-+/g, "-"); // collapse consecutive hyphens
  result = result.replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
  if (!result) {
    return "general";
  }
  return result;
}
