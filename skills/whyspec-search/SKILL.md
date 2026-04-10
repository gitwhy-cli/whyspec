---
name: whyspec-search
description: Use when looking for why something was built a certain way or finding past decisions.
argument-hint: "<query> [--domain <domain>]"
---

Search reasoning — find past decisions, contexts, and intent across all changes.

---

**Input**: A search query string. Optionally include `--domain <domain>` to filter by domain.

## When to Search

Search is not just a lookup tool — it's the **team knowledge check** before new work:

- **Before planning**: "Has anyone reasoned about auth in this codebase before?"
- **During debugging**: "Have we seen this error pattern before? What was the root cause?"
- **Before refactoring**: "Why was this built this way? Was it a deliberate decision or tech debt?"
- **During code review**: "Does this approach contradict past decisions?"

## Steps

1. **Run the search**

   ```bash
   whyspec search --json "<query>"
   ```

   If ARGUMENTS includes `--domain`:
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

2. **Display results with scores AND reasoning snippets**

   <examples>
   <good>
   ## Search: "authentication"

   Found 3 results:

   1. [score: 130] **JWT Auth with RS256** (add-auth)
      Domain: authentication | Matched: title, reasoning
      > "Chose RS256 over HS256 — allows key rotation without redeploying.
      >  Session stored in httpOnly cookie, not localStorage (XSS protection).
      >  Token expiry: 15min access, 7d refresh — balances security vs UX."

      This decision affects your current work if you're touching auth tokens
      or session management.

   2. [score: 30] **Database Migration Plan** (migrate-db)
      Domain: database | Matched: reasoning
      > "Considered token storage in DB but rejected — added 3ms latency per
      >  request. Chose Redis for session cache instead (src/lib/redis.ts)."

   3. [score: 20] **API Rate Limiting** (add-rate-limits)
      Domain: api | Matched: files
      > "src/middleware/auth.ts — modified to extract JWT sub claim for
      >  per-user rate limiting after authentication."

   View full story: `/whyspec:show add-auth`
   Narrow by domain: `/whyspec:search "authentication" --domain auth`
   Why good: Shows the actual reasoning from past decisions. A developer
   searching for "authentication" immediately sees WHY RS256 was chosen,
   WHY httpOnly cookies, and WHERE token decisions connect to rate limiting.
   The annotation "This decision affects..." connects past to present.
   </good>

   <bad>
   ## Search: "authentication"

   Found 3 results:

   1. **add-auth** — JWT Authentication Setup
   2. **migrate-db** — Database Migration Plan
   3. **add-rate-limits** — API Rate Limiting

   Why bad: Just titles with no reasoning snippets. The developer has to
   open each one to find the relevant decision. Defeats the purpose of search.
   </bad>

   <good>
   ## Search: "why is the session timeout 15 minutes"

   No results found for "why is the session timeout 15 minutes".

   Suggestions:
   - Try broader terms: "session", "timeout", "token expiry"
   - Search by domain: `/whyspec:search "session" --domain auth`
   - Check if this decision was captured: maybe it predates WhySpec adoption
   Why good: Empty results get helpful guidance, not a dead end.
   </good>

   <bad>
   ## Search: "why is the session timeout 15 minutes"

   No results found.
   Why bad: Dead end. No help. User is stuck.
   </bad>
   </examples>

3. **Connect results to the current context**

   If the search was triggered during planning or debugging, connect the findings:
   - During `/whyspec:plan`: "Past decision in add-auth chose RS256 — your new feature should be compatible with this."
   - During `/whyspec:debug`: "Similar bug was investigated in debug-token-expiry — root cause was clock skew between services."
   - Standalone: Offer follow-up actions: `/whyspec:show <name>` or narrower search.

## Tools

| Tool | When to use | When NOT to use |
|------|------------|-----------------|
| **Bash** | Run `whyspec search --json "<query>"` — the primary search mechanism | Don't search manually with grep |
| **Read** | Follow up on results — read full context files when the snippet isn't enough | Don't read every result; focus on high-scoring ones |
| **Grep** | Supplement: search code for implementations referenced in search results | Don't use grep as a replacement for whyspec search |

No AskUserQuestion — this is a display-only skill. Show results and offer follow-up commands.

## Guardrails

- **Always show scores** — include the relevance score so the user understands ranking.
- **Always show snippets** — the reasoning excerpt is more useful than titles alone. Show the most relevant decision or trade-off text.
- **Handle empty results helpfully** — suggest broader terms, different keywords, or domain filters. Never just say "No results."
- **Don't fabricate results** — only display what the CLI returns. Never synthesize or guess at matches.
- **Connect past to present** — when results are clearly relevant to ongoing work, say so explicitly.
- **Search includes plan files** — the CLI searches intent.md and design.md too, not just context files. This finds planned decisions that haven't been captured yet.
