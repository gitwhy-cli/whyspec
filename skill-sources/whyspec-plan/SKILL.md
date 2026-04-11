---
name: whyspec-plan
description: Use when planning a code change, capturing decisions before coding, or setting up the Decision Bridge.
argument-hint: "<change-name-or-description>"
---

Plan a change — create intent.md, design.md, and tasks.md with the Decision Bridge.

When ready to implement, run `/whyspec-execute`

---

**Input**: A change name (kebab-case) or description of what to build via ARGUMENTS.

## Iron Law

**ACT FIRST, ASK ONLY WHEN STUCK.** The user invoked `/whyspec-plan` with a description of what they want. Your job is to structure their intent into plan files — not to interview them.

## Red Flags — If You're Thinking This, STOP

- "I should ask what problem this solves" → The user TOLD you. Read ARGUMENTS.
- "Let me ask about constraints first" → Explore the codebase. Find them yourself.
- "I need more context before I can plan" → You have a codebase. Read it.
- "This is too vague to plan" → Even "fix auth" is enough. Read the auth code, find the issues, plan the fix.
- "I'll create a generic template and ask the user to fill it in" → That's not planning. That's homework assignment.

## Steps

1. **Parse ARGUMENTS and infer intent**

   Read what the user typed. Derive a kebab-case name (e.g., "add user authentication" → `add-user-auth`).

   **If ARGUMENTS is empty or a single ambiguous word** (e.g., just "plan" or "help"):
   Ask ONE question: "What change are you planning?" — then proceed.

   **If ARGUMENTS has any meaningful description** (even brief):
   Proceed immediately. Do NOT ask forcing questions. The user told you what they want.

   <examples>
   <good>
   User: `/whyspec-plan add dark mode support`
   Agent: Creates change folder, writes intent.md capturing dark mode as the goal,
   design.md with CSS custom properties vs class-based approach trade-off,
   tasks.md with implementation steps.
   Why good: User stated what they want. Agent structured it into plan files without interrogation.
   </good>

   <bad>
   User: `/whyspec-plan add dark mode support`
   Agent: "What problem does this solve? Who feels this pain today?"
   Why bad: The user literally just told you — they want dark mode. Asking "what problem does
   this solve" is patronizing checklist-walking. The answer is obvious from the input.
   </bad>

   <good>
   User: `/whyspec-plan`
   Agent: "What change are you planning?"
   Why good: ARGUMENTS is empty. ONE question to get started is justified.
   </good>

   <bad>
   User: `/whyspec-plan refactor auth middleware`
   Agent: "What constraints exist? What does success look like? How will you know it works?"
   Why bad: Three rounds of corporate interview questions. The user wants to refactor auth
   middleware — explore the codebase to understand constraints, don't ask generic questions.
   </bad>
   </examples>

2. **Create the change folder**

   ```bash
   whyspec plan --json "<name>"
   ```

   Parse the JSON response:
   - `path`: The change directory (e.g., `whyspec/changes/add-auth/`)
   - `templates`: Template content for intent.md, design.md, tasks.md
   - `context`: Project context from config.yaml (constraints for you — do NOT copy into files)
   - `rules`: Project-specific rules (constraints for you — do NOT copy into files)

   If a change with that name already exists, ask: continue the existing change, or create a new one with a different name?

3. **Explore codebase for context** (if the change touches existing code)

   Before writing plan files, read relevant code to understand:
   - Current architecture in the affected area
   - Existing patterns and conventions
   - Dependencies and constraints

   <examples>
   <good>
   User wants to add rate limiting.
   Agent reads src/middleware/index.ts, finds Express + helmet at line 12,
   sees the middleware chain: cors → helmet → bodyParser → routes.
   Writes design.md: "Insert express-rate-limit after helmet in the existing
   chain at src/middleware/index.ts:14. Use sliding window algorithm.
   Redis backing via existing ioredis client at src/lib/redis.ts."
   Why good: References exact files, line numbers, existing dependencies.
   Plan is grounded in code the agent actually read.
   </good>

   <bad>
   User wants to add rate limiting.
   Agent writes design.md: "Consider using express-rate-limit or a custom
   middleware solution. Evaluate Redis vs in-memory storage."
   Why bad: Generic advice from training data. Ignores the actual codebase.
   Could have been written without reading a single file.
   </bad>
   </examples>

4. **Create intent.md**

   Write to `<path>/intent.md`. Here's a concrete filled-in example:

   ```markdown
   ## Why This Change Exists

   POST /api/users returns 500 under load because we have no rate limiting.
   Production logs show 12k requests/min from a single IP during the March 28 incident.

   ## What It Enables

   API stability under load. Prevents abuse without blocking legitimate traffic.

   ## Decisions to Make

   - [ ] Rate limit storage: Redis (shared across 3 instances) vs in-memory (simpler, single-instance only)?
   - [ ] Limit granularity: per-IP vs per-user-token vs both?
   - [ ] Response on limit: 429 with Retry-After header vs 429 with custom error body?

   These checkboxes form the "before" side of the Decision Bridge.
   They will be resolved during /whyspec-capture after implementation.

   ## Constraints

   - Must work with existing Express middleware chain (cors → helmet → bodyParser → routes)
   - Redis (ioredis) already available at src/lib/redis.ts — prefer reuse over new dependency
   - P99 latency budget: <5ms per request for rate limit check

   ## Success Looks Like

   - `npm test` passes with rate limit integration tests
   - Siege test: 1000 req/s returns 429 after threshold, Retry-After header present
   - No latency regression visible in existing API benchmark

   ## Assumptions

   - Redis is available in all environments (need to verify staging)
   - Current ioredis client supports the rate limiting pattern we choose
   ```

   **IMPORTANT**: The "Decisions to Make" checkboxes are the Decision Bridge. Every unsettled design choice MUST be listed here.

   <examples>
   <good>
   ## Decisions to Make
   - [ ] Rate limit storage: Redis (shared across instances) vs in-memory (simpler, single-instance only)?
   - [ ] Limit granularity: per-IP vs per-user-token vs both?
   - [ ] Response on limit: 429 with Retry-After header vs 429 with custom error body?
   Why good: Specific, actionable decisions with concrete options derived from the codebase.
   </good>

   <bad>
   ## Decisions to Make
   - [ ] What technology to use?
   - [ ] How to implement it?
   - [ ] What approach is best?
   Why bad: Vague decisions that could apply to literally any change. Not useful.
   </bad>
   </examples>

5. **Create design.md**

   Write to `<path>/design.md`. Skip the trade-off matrix for simple changes:

   ```markdown
   ## Approach

   [Chosen technical direction — 2-3 sentences grounded in the actual codebase]

   ## Trade-off Matrix

   | Option | [Criterion 1] | [Criterion 2] | [Criterion 3] |
   |--------|---------------|---------------|---------------|
   | Option A | ... | ... | ... |
   | Option B | ... | ... | ... |

   ## Architecture

   [ASCII diagram showing the design — components, data flow, boundaries]

   ## Questions to Resolve

   - [ ] [Open question needing an answer before or during coding]

   ## Risks & Unknowns

   - [What could go wrong]

   ## Dependencies

   - [External libraries, APIs, services]
   ```

6. **Create tasks.md**

   Write to `<path>/tasks.md`. Define verification FIRST — goal-backward planning:

   ```markdown
   ## Verification

   What proves this change works — defined BEFORE tasks:

   - [ ] [Verification criterion 1]
   - [ ] [Verification criterion 2]

   ## Tasks

   - [ ] Task 1: [description]
     verify: [how to verify this specific task]
   - [ ] Task 2: [description]
     verify: [verification step]
   ```

   Each task should be small enough for one atomic commit.

7. **Show summary**

   ```
   ## Plan Created: <name>

   <path>/
     intent.md    — WHY: problem, constraints, success criteria
     design.md    — HOW: approach, trade-offs, decisions to make
     tasks.md     — WHAT: verification criteria + implementation checklist

   Decisions to make: N pending
   Tasks: N defined

   Ready to implement? Run /whyspec-execute
   ```

## Tools

| Tool | When to use | When NOT to use |
|------|------------|-----------------|
| **Glob** | Find files by pattern before writing plan (e.g., `src/middleware/**/*.ts`) | Don't glob blindly — know what area you're looking for |
| **Grep** | Search for patterns in code (e.g., existing rate limit logic, auth middleware) | Don't grep the whole repo — scope to relevant dirs |
| **Read** | Read specific files to understand architecture before planning | Don't read files unrelated to the change |
| **Bash** | Run `whyspec plan --json` (CLI-as-oracle). Run `git log` to understand recent changes | Don't run destructive commands |
| **AskUserQuestion** | ONLY when ARGUMENTS is empty or genuinely ambiguous (see format below) | Don't ask questions answerable by reading code |

### Codebase First, Web Never-First

Read the codebase BEFORE considering web search. Web search is justified ONLY when:
- The change involves a library/framework not present in the codebase
- You need version-specific migration docs
- Security advisory lookup (CVEs)

Never search the web for: architecture decisions, "best practices", or how to use a library already in the codebase.

### AskUserQuestion Format (use sparingly)

When you MUST ask (ARGUMENTS empty, or genuinely stuck after codebase exploration):

1. **Re-ground**: "Planning **<change>** in `<project>` on `<branch>`"
2. **What you found**: Show what you already discovered in the codebase
3. **One specific question**: Not a checklist. One thing you need.
4. **Recommendation**: "I'd suggest X because Y — your call"

<examples>
<good>
Planning **add-rate-limiting** in `my-api` on `main`

I found Express 4.18 with helmet middleware at src/middleware/index.ts,
and an existing ioredis client at src/lib/redis.ts.

Should the rate limit apply globally (all routes) or only to /api/* routes?
I'd suggest /api/* only — internal health checks shouldn't be rate-limited.
Why good: Shows what was already found. Asks ONE specific question with a recommendation.
</good>

<bad>
What problem does this solve? What constraints exist? How will you know it works?
Why bad: Three generic questions. No codebase context. Classic checklist-walking.
</bad>
</examples>

## Escalation Protocol

If you hit any of these, STOP and ask the user (max 3 attempts before escalating):

| Situation | Action |
|-----------|--------|
| ARGUMENTS is genuinely ambiguous after codebase exploration | Ask ONE specific question, not a checklist |
| Multiple valid architectures with no clear winner | Present the trade-off matrix, ask user to pick |
| Change requires access or knowledge you don't have | State what you know, what you need, and ask |
| After 3 failed attempts to infer intent | Escalate: "I need more context. Here's what I've found so far: [findings]" |

## Guardrails

- **Don't interrogate the user** — if ARGUMENTS contains a meaningful description, proceed. Only ask when ARGUMENTS is empty or genuinely ambiguous.
- **Ground plans in the codebase** — read relevant code before writing. Plans that ignore the actual architecture are useless.
- **Don't implement code** — this skill creates plan files only. Implementation happens in `/whyspec-execute`.
- **Don't skip "Decisions to Make"** — every unsettled design choice must be a checkbox. If you can't find any decisions, you haven't thought hard enough about the change.
- **Use CLI-as-oracle** — always call `whyspec plan --json` to create the folder. Don't create paths or generate IDs manually.
- **Apply `context` and `rules` as constraints** — they guide your writing but must NOT appear in the output files.
- **Verification before tasks** — in tasks.md, define what "done" looks like before listing the work.
- **Scale to the change** — a typo fix gets a 3-line intent and 1 task. A major refactor gets the full treatment.

## Rationalization Table

| If you catch yourself thinking... | Reality |
|----------------------------------|---------|
| "I should ask the user some clarifying questions first" | Read the codebase. Most "clarifying questions" can be answered by reading code. |
| "The user's description is too vague to plan" | Even "fix auth" is plannable — read the auth code, find the issues, plan the fix. |
| "I need to understand the full architecture before planning" | Plan the change, not the universe. Read what's relevant, skip what's not. |
| "I should create a comprehensive plan with all sections" | Scale to the change. A 1-line fix gets a 3-line plan. Don't over-engineer. |
| "Let me ask about success criteria" | Infer from the change. "Success = tests pass + the thing works." Write it yourself. |
| "I'll write generic placeholder text and the user can fill it in" | That's not planning. Populate every field with specific, codebase-grounded content. |

## Anti-Patterns

| If you're about to... | STOP — do this instead |
|----------------------|----------------------|
| Ask "What problem does this solve?" | Read ARGUMENTS — the user just told you |
| Ask "What constraints exist?" | Explore the codebase — find the constraints yourself |
| Ask "Who is this for?" | This is a code change, not a product pitch |
| Write a generic plan without reading code | Read the affected files first |
| Create a massive plan for a small fix | Scale the plan to match the change size |
| Skip Decisions to Make because "it's obvious" | If it's obvious, write it down — it takes 10 seconds |
