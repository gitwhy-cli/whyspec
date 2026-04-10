---
name: whyspec-execute
description: Use when starting implementation, continuing work, or executing tasks from a WhySpec plan.
argument-hint: "[change-name]"
---

Implement a change — read the plan, work through tasks, commit atomically.

When all tasks are done, run `/whyspec:capture` to save your reasoning.

---

**Input**: Optionally specify a change name. If omitted, auto-detect or prompt for available changes.

## Iron Law

**NEVER SKIP THE PLAN.** Read intent.md and design.md before writing a single line of code. The plan is the contract — if reality doesn't match the plan, update the plan first.

## Red Flags — If You're Thinking This, STOP

- "The plan is clear enough, I'll just start coding" → Read intent.md. Now. It takes 15 seconds.
- "I'll batch all changes into one commit at the end" → One commit per task. That's the contract.
- "This task seems unnecessary, I'll skip it" → Ask the user to remove it. Don't silently skip.
- "The design says X but Y is clearly better" → Flag the contradiction. Don't silently override.
- "I'm done, no need to run the verify step" → Run it. Evidence beats confidence.

## Steps

1. **Select the change**

   If ARGUMENTS provides a name, use it. Otherwise:
   - Auto-select if only one active change exists
   - If multiple changes exist, run `whyspec list --json` and let the user select

   Announce: "Executing change: **<name>**"

2. **Load execution context**

   ```bash
   whyspec execute --json "<name>"
   ```

   Parse the JSON response:
   - `change_name`: The change being executed
   - `intent`: Content of intent.md
   - `design`: Content of design.md
   - `tasks`: Content of tasks.md
   - `progress`: `{ total, completed, remaining }`
   - `pending_tasks`: Array of uncompleted tasks

3. **Read plan files for context**

   Read the full content of:
   - `intent.md` — understand WHY this change exists, what constraints apply
   - `design.md` — understand HOW to approach it, what decisions are pending
   - `tasks.md` — understand WHAT to implement and how to verify

   Keep intent and design in mind throughout implementation. When making a decision during coding, check if it's listed under "Decisions to Make" — you're resolving the Decision Bridge in real-time.

4. **Show current progress**

   ```
   ## Executing: <name>

   Progress: N/M tasks complete
   Remaining:
   - [ ] Task description 1
   - [ ] Task description 2
   ```

5. **Implement tasks sequentially**

   For each pending task:

   a. Show: `Working on task N/M: <description>`
   b. Implement the code changes
   c. Mark task complete in tasks.md: `- [ ]` → `- [x]`
   d. Run the task's `verify:` check if one is defined
   e. Commit atomically — one commit per task or logical unit
   f. Continue to next task

   <examples>
   <good>
   Working on task 3/5: Add rate-limit middleware

   Reading src/middleware/index.ts — current chain: cors → helmet → bodyParser → routes
   Installing express-rate-limit@7.1.0 (compatible with Express 4.18)
   Added rateLimiter middleware after helmet at src/middleware/index.ts:14
   Config: 100 req/15min window, Redis store via existing src/lib/redis.ts client

   verify: `npm test -- --grep "rate-limit"` → 4 tests pass
   verify: `curl -I localhost:3000/api/users` → X-RateLimit-Limit: 100 header present

   Committed: "feat(middleware): add rate-limit middleware with Redis backing"
   Why good: References exact files/lines, shows what was done and why,
   runs specific verification commands, commits atomically with clear message.
   </good>

   <bad>
   Working on task 3/5: Add rate-limit middleware
   Done! Moving to task 4.
   Why bad: No detail about what was implemented. No verification.
   No commit. The user can't tell if this was done correctly.
   </bad>

   <good>
   Working on task 2/4: Refactor auth to use JWT
   PAUSE — design.md says "cookie-based sessions" (design.md:12) but this task
   says "JWT". This contradicts the design.
   Options:
   A) Update design.md to JWT and continue (Recommended — JWT aligns with the API-first intent)
   B) Implement cookie-based sessions as designed
   C) Discuss the trade-offs before deciding
   Why good: Catches a contradiction between plan and task. Stops to resolve
   with specific options instead of silently making a decision.
   </good>

   <bad>
   Working on task 2/4: Refactor auth to use JWT
   Design says cookies but I'll use JWT since the task says so.
   Why bad: Silently overrides the design without flagging the contradiction.
   </bad>
   </examples>

6. **On completion**

   Report status using completion codes:

   | Status | When | What to show |
   |--------|------|-------------|
   | DONE | All tasks completed and verified | Full summary + `/whyspec:capture` prompt |
   | DONE_WITH_CONCERNS | Tasks done but something feels off | Summary + concerns + `/whyspec:capture` |
   | BLOCKED | Cannot proceed without input | Blocker details + resume command |
   | NEEDS_CONTEXT | Missing information | Specific question about what's missing |

   ```
   ## DONE

   Change: <name>
   Progress: M/M tasks complete

   Completed:
   - [x] Task 1: description — committed as "feat: ..."
   - [x] Task 2: description — committed as "feat: ..."

   Ready to capture reasoning? Run /whyspec:capture
   ```

## Tools

| Tool | When to use | When NOT to use |
|------|------------|-----------------|
| **Read** | Read plan files (intent.md, design.md, tasks.md) BEFORE coding | Don't skip reading the plan |
| **Grep** | Find affected code before editing (e.g., all usages of a function you're changing) | Don't grep after editing — grep BEFORE to understand impact |
| **Edit** | Modify existing files — prefer Edit over Write for existing code | Don't rewrite entire files when a targeted edit suffices |
| **Write** | Create new files only | Don't use Write to modify existing files |
| **Bash** | Run tests (`npm test`), verify (`curl`, build commands), commit (`git commit`) | Don't run destructive git commands without asking |
| **AskUserQuestion** | When a task is unclear, or design contradicts implementation (see format below) | Don't ask about things you can determine from the plan or code |

### AskUserQuestion Format (use for contradictions and blockers)

1. **Re-ground**: "Executing task N/M of **<change>** — `<task description>`"
2. **The contradiction/blocker**: What you found vs what the plan says
3. **Options with recommendation**: Lettered choices with your pick

<examples>
<good>
Executing task 2/4 of **add-rate-limiting** — "Configure Redis store"

design.md says use the existing ioredis client (src/lib/redis.ts:8), but that
client uses `db: 0` which is shared with session data. Rate limit keys could
collide with session keys.

A) Use db: 0 with a `ratelimit:` key prefix (simple, small collision risk)
B) Create a separate client on db: 1 (isolated, adds ~2MB memory)
C) Reuse db: 0 but with a Redis namespace library

I'd recommend B — isolation is worth 2MB.
Why good: Specific blocker with evidence from code. Options with trade-offs.
</good>
</examples>

## Escalation Protocol

| Situation | Attempts allowed | Action |
|-----------|-----------------|--------|
| Task is unclear or ambiguous | 0 — ask immediately | Ask ONE specific clarification question |
| Implementation keeps failing | 3 attempts max | Report: what was tried, what failed, what error |
| Design contradiction found | 0 — flag immediately | Present options, let user decide |
| Unexpected dependency or constraint | 1 attempt to resolve | If can't resolve, present findings and ask |

## Rationalization Table

| If you catch yourself thinking... | Reality |
|----------------------------------|---------|
| "I'll read the plan later, the task name is clear enough" | The plan has constraints you'll violate. Read it. 15 seconds. |
| "One big commit is fine, I'll split it later" | You won't. Atomic commits are the contract. Do it now. |
| "This test is probably passing, no need to run it" | "Probably" is not evidence. Run the test. |
| "I'll skip the verify step for this trivial task" | Trivial tasks have trivial verifications. Run them anyway. |
| "The design is slightly wrong but my way is better" | Flag it. The user made the design for a reason you might not see. |

## Guardrails

- **Read intent.md before coding** — every implementation decision should align with the stated intent and constraints.
- **Never skip tasks** — work through all tasks in order. If a task seems unnecessary, ask the user to remove it rather than silently skipping.
- **Commit atomically** — one commit per task or logical unit. Don't batch all changes into one commit.
- **Pause on unclear tasks** — don't guess at ambiguous requirements. Ask for clarification.
- **Pause on design issues** — if reality doesn't match the plan, stop and suggest design.md updates before continuing.
- **Mark checkboxes immediately** — update tasks.md after each task completion, not at the end.
- **Always prompt capture** — end every execution session with the `/whyspec:capture` suggestion.
