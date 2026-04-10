---
name: whyspec-capture
description: Use after coding to preserve reasoning — resolves the Decision Bridge with actual outcomes.
argument-hint: "[change-name]"
---

Capture reasoning — create a context file that resolves the Decision Bridge and preserves the full story.

View the complete story with `/whyspec-show`

---

**Input**: Optionally specify a change name. If omitted, auto-detect the most recently executed change.

## Iron Law

**CAPTURE REASONING, NOT SUMMARIES.** "We used Redis" is a summary. "We chose Redis over in-memory because the app runs on 3 instances and rate limits must be shared — in-memory would let users bypass limits by hitting different instances" is reasoning. Every decision needs the WHY.

## Red Flags — If You're Thinking This, STOP

- "The implementation was straightforward, not much to capture" → Every implementation has decisions. Find them.
- "I'll just summarize what files changed" → That's a git log, not reasoning. Capture WHY, not WHAT.
- "There were no surprises" → Look harder. Did you deviate from the plan at all? Change any approach? That's a surprise.
- "The decisions are obvious from the code" → They're obvious NOW. In 6 months, they won't be. Write the rationale.

## Steps

1. **Select the change**

   If ARGUMENTS provides a name, use it. Otherwise:
   - Auto-detect the most recently executed change (look for changes with completed tasks)
   - If ambiguous, run `whyspec list --json` and let the user select

2. **Read plan files for Decision Bridge mapping**

   Read these files from the change folder — **required** before generating context:
   - `<path>/intent.md` — the stated intent, "Decisions to Make" checkboxes
   - `<path>/design.md` — the approach, "Questions to Resolve" items

   Extract and track:
   - Every `- [ ]` or `- [x]` item under "Decisions to Make" → each MUST be resolved in the context
   - Every item under "Questions to Resolve" → each MUST be answered
   - The stated constraints and success criteria → compare against what actually happened

3. **Get capture data from CLI**

   ```bash
   whyspec capture --json "<name>"
   ```

   Parse the JSON response:
   - `template`: Context file template
   - `commits`: Commits associated with this change (auto-detected from git)
   - `files_changed`: Files modified during implementation (auto-detected)
   - `decisions_to_make`: Decision checkboxes extracted from plan files
   - `change_name`: The change name for the header

4. **Populate the Decision Bridge**

   This is the core of the capture. Map every planned decision to its outcome:

   a. **Decisions to Make → Decisions Made**: For EACH checkbox from intent.md, record:
      - What was decided
      - Why (the rationale — not just the choice, but the reasoning)
      - Any constraints that influenced the decision

   b. **Questions to Resolve → Answers**: For EACH question from design.md, record:
      - The answer that emerged during implementation
      - How it was determined

   c. **Capture Surprises**: Identify decisions made during implementation that were NOT in the original plan:
      - "What did we decide that we didn't plan to decide?"
      - "What changed from the original design?"
      - "What unexpected requirements emerged?"

   If a planned decision was NOT made during implementation, note it as unresolved and ask the user.

   <examples>
   <good>
   ## Decisions Made

   **Rate limit storage → Redis**
   Chose Redis over in-memory. The app runs on 3 instances behind an ALB.
   In-memory rate limiting would let users bypass limits by hitting different
   instances. Redis adds ~2ms latency per check, but our p99 is already 180ms
   so the overhead is negligible. Reused the existing ioredis client at
   src/lib/redis.ts rather than adding a new dependency.

   **Limit granularity → Both IP and token**
   IP-only would block shared offices (NAT). Token-only would let unauthenticated
   abuse through. Implemented tiered: 100/15min per IP for unauthenticated,
   1000/15min per token for authenticated. The token tier uses the JWT sub claim.

   **429 response → Standard with Retry-After**
   Went with standard 429 + Retry-After header. Custom error body would require
   updating all API clients. The Retry-After header is sufficient for automated
   retry logic and doesn't break existing integrations.
   Why good: Each decision has the WHAT (choice), WHY (rationale), and HOW
   (specific implementation detail). References actual code and numbers.
   </good>

   <bad>
   ## Decisions Made
   - Used Redis for rate limiting
   - Implemented per-IP and per-token limits
   - Returns 429 status code
   Why bad: Just restates WHAT was done. No WHY. No trade-off reasoning.
   A future developer learns nothing about why these choices were made.
   </bad>

   <good>
   ## Surprises (not in original plan)

   **Added X-Request-ID middleware** — During implementation, discovered that
   429 responses were impossible to debug without a request ID. Added
   X-Request-ID header generation as a prerequisite in src/middleware/requestId.ts.
   This wasn't in the plan but is essential for production debugging.
   Follow-up: Should be extracted into its own WhySpec change if we add more observability.

   **Changed Redis key schema** — Plan assumed simple key-value, but discovered
   the sliding window algorithm needs sorted sets. Changed from `ratelimit:{ip}`
   string keys to `ratelimit:{ip}` sorted sets with timestamp scores.
   This affects the Redis memory profile — noted in Risks.
   Why good: Documents unplanned decisions with full context. Notes follow-up items.
   </good>

   <bad>
   (No surprises section)
   Why bad: Every implementation has surprises. If you didn't document any,
   you weren't paying attention.
   </bad>
   </examples>

5. **Generate ctx_<id>.md in SaaS XML format**

   Write to `<path>/ctx_<id>.md` using the GitWhy SaaS format:

   ```xml
   <context>
     <title>Short title describing what was built and why</title>

     <story>
       Phase-organized engineering journal. First-person, chronological.
       Capture the FULL reasoning — not a summary.

       Phase 1 — [Setup/Context]:
       What the user asked for, initial understanding, preparation work.

       Phase 2 — [Implementation]:
       What was built, key decision points encountered, problems solved.
       Reference specific files and approaches.

       Phase 3 — [Verification]:
       How the work was verified, test results, manual checks.
     </story>

     <reasoning>
       Why this approach was chosen over alternatives.

       <decisions>
         - [Planned decision] — [chosen option] — [rationale]
       </decisions>

       <rejected>
         - [Alternative not chosen] — [why it was rejected]
       </rejected>

       <tradeoffs>
         - [Trade-off accepted] — [what was gained vs lost]
       </tradeoffs>

       Surprises (decisions not in the original plan):
       - [Unexpected decision] — [why it was needed]
     </reasoning>

     <files>
       path/to/file.ts — new — Brief description
       path/to/other.ts — modified — Brief description
     </files>

     <agent>claude-code (model-name)</agent>
     <tags>comma, separated, domain, keywords</tags>
     <verification>Test results and build status</verification>
     <risks>Open questions, follow-up items, known limitations</risks>
   </context>
   ```

6. **Show summary**

   ```
   ## Reasoning Captured: <name>

   Context: ctx_<id>.md

   Decision Bridge:
     Planned decisions resolved: N/N
     Questions answered: N/N
     Surprises captured: N

   Files documented: N
   Commits linked: N

   View the full story: /whyspec-show <name>
   ```

## Tools

| Tool | When to use | When NOT to use |
|------|------------|-----------------|
| **Read** | Read intent.md and design.md for Decision Bridge mapping (REQUIRED first step) | Don't skip reading plan files |
| **Bash** | Run `whyspec capture --json`, `git log --oneline` to find commits, `git diff` to review changes | Don't modify code during capture |
| **Write** | Create the ctx_<id>.md context file | Don't overwrite existing context files |
| **Grep** | Search for decisions referenced in plan files (verify they were implemented) | Don't search the entire codebase |
| **AskUserQuestion** | When a planned decision was NOT made during implementation — ask the user to resolve | Don't ask about decisions that are clearly resolved in the code |

### AskUserQuestion Format (for unresolved decisions only)

1. **Re-ground**: "Capturing reasoning for **<change>**"
2. **The gap**: Which planned decision wasn't resolved
3. **What you found**: Evidence from the code about what actually happened
4. **Ask for rationale**: "What drove this choice?"

## Rationalization Table

| If you catch yourself thinking... | Reality |
|----------------------------------|---------|
| "This decision is obvious, no need to explain it" | It's obvious now. In 6 months with new team members, it won't be. |
| "The code is self-documenting" | Code shows WHAT. Context captures WHY. They're complementary. |
| "There were no surprises during implementation" | You changed zero things from the plan? Really? Look again. |
| "I'll just list the files that changed" | That's `git diff --stat`. The capture's value is reasoning, not file lists. |
| "The rationale is already in the commit messages" | Commit messages are 1-2 lines. Reasoning is paragraphs. Different depth. |

## Guardrails

- **Must read plan files FIRST** — never generate context without reading intent.md and design.md. The Decision Bridge requires mapping FROM plan TO outcome.
- **Every planned decision must be resolved** — if intent.md lists 5 "Decisions to Make", all 5 must appear in the context. Prompt the user for any that weren't addressed.
- **Never skip surprises** — unplanned decisions are the most valuable context. Actively search for them.
- **Use SaaS XML format exactly** — the `<context>` tags must match the GitWhy format so `git why log` and `git why push` work without conversion.
- **Include verification results** — what tests pass, what was manually verified. Evidence, not claims.
- **Don't fabricate rationale** — if you don't know why a decision was made, ask the user. Invented reasoning is worse than no reasoning.
- **One context per capture** — each `/whyspec-capture` invocation creates exactly one `ctx_<id>.md` file.
