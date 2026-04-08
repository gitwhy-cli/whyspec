---
name: whyspec-search
description: Search past reasoning, decisions, and contexts across all changes. Use when looking for why something was built a certain way, finding past decisions, or discovering institutional knowledge.
---

Search reasoning — find past decisions, contexts, and intent across all changes.

---

**Input**: A search query string. Optionally include `--domain <domain>` to filter by domain.

**Steps**

1. **Run the search**

   ```bash
   whyspec search --json "<query>"
   ```

   If a domain filter is specified:
   ```bash
   whyspec search --json "<query>" --domain "<domain>"
   ```

   Parse the JSON response — an array of scored results, each containing:
   - `id`: Context ID (e.g., `ctx_a1b2c3d4`) or file identifier
   - `title`: Context or intent title
   - `change_name`: Name of the change
   - `domain`: Auto-detected or specified domain
   - `score`: Relevance score (title=100, reasoning=30, files=20, general=10)
   - `matched_sections`: Which sections matched (title, reasoning, files, etc.)
   - `path`: File path for retrieval
   - `snippet`: Most relevant text excerpt

2. **Display results with scores and snippets**

   ```
   ## Search: "<query>"

   Found N results:

   1. [score: 130] **JWT Authentication Setup** (add-auth)
      Domain: authentication | Matched: title, reasoning
      > "Chose RS256 over HS256 — allows key rotation without redeploying"

   2. [score: 30] **Database Migration Plan** (migrate-db)
      Domain: database | Matched: reasoning
      > "Considered token storage in DB but rejected — latency concerns"

   3. [score: 20] **API Rate Limiting** (add-rate-limits)
      Domain: api | Matched: files
      > "src/auth/middleware.ts — modified"
   ```

   For each result, show the most relevant decision or reasoning snippet — not just the title.

3. **Offer follow-up actions**

   After displaying results:
   - "View full story: `/whyspec:show <change-name>`"
   - "Narrow by domain: `/whyspec:search \"<query>\" --domain <domain>`"

**Guardrails**

- **Always show scores** — include the relevance score so the user understands why results are ranked.
- **Always show snippets** — the reasoning excerpt is more useful than titles alone. Show the most relevant decision or trade-off text.
- **Handle empty results clearly** — if nothing matches, say "No results found for '<query>'" and suggest broader search terms or different keywords.
- **Don't fabricate results** — only display what the CLI returns. Never synthesize or guess at matches.
- **Search includes plan files** — the CLI searches intent.md and design.md too, not just context files. This finds planned decisions that haven't been captured yet.
