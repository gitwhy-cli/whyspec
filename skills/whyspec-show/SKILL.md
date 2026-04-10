---
name: whyspec-show
description: Use when reviewing the full story of a change — intent, design, tasks, and Decision Bridge delta.
argument-hint: "[change-name]"
---

Show the full story — from intent through design, tasks, and reasoning — with the Decision Bridge delta.

---

**Input**: A change name. If omitted, prompt for available changes.

## What Makes a Good Story

The show command doesn't just dump files — it tells the **narrative arc** of a change:
1. **Intent** — Why did we start this? What pain existed?
2. **Design** — How did we plan to solve it? What trade-offs did we consider?
3. **Tasks** — What concrete work was done? How much is complete?
4. **Reasoning** — What actually happened? What surprised us?
5. **Decision Bridge** — How did our thinking evolve from plan to reality?

The Decision Bridge delta is the most valuable output — it reveals the gap between what we THOUGHT we'd do and what we ACTUALLY did.

## Steps

1. **Get the full story from CLI**

   ```bash
   whyspec show --json "<name>"
   ```

   Parse the JSON response:
   - `intent`: Content of intent.md
   - `design`: Content of design.md
   - `tasks`: Content of tasks.md with completion status
   - `context`: Content of ctx_<id>.md (if captured)
   - `decision_bridge_delta`: Computed delta of planned vs actual decisions
   - `surprises`: Decisions not in the original plan

   If no change name provided:
   - Run `whyspec list --json` to get available changes
   - Let the user select

2. **Display the full story as a narrative arc**

   ```
   # <Change Name>

   ## Intent (WHY)
   [From intent.md — problem statement, what it enables, constraints, success criteria]

   ## Design (HOW)
   [From design.md — approach, architecture, trade-offs considered]

   ## Tasks (WHAT)
   [From tasks.md — task list with completion status]
   Progress: N/M tasks complete

   ## Reasoning (AFTER)
   [From ctx_<id>.md — story of what happened, decisions made, trade-offs accepted]
   ```

   If context hasn't been captured yet:
   ```
   ## Reasoning (AFTER)
   Not yet captured. Run /whyspec:capture to complete the story.
   ```

3. **Highlight the Decision Bridge Delta**

   When both plan files and context exist, display the evolution:

   <examples>
   <good>
   ## Decision Bridge

   | Decision | Planned (Before) | Actual (After) | Delta |
   |----------|-------------------|----------------|-------|
   | Rate limit storage | Redis vs in-memory? | Redis — 3 instances need shared state | As planned |
   | Limit granularity | per-IP vs per-token? | Both — IP for anon, token for auth'd | Expanded scope |
   | 429 response | standard vs custom? | Standard + Retry-After header | As planned |

   ### Surprises (not in original plan)
   - **Added X-Request-ID middleware** — needed for debugging 429 responses.
     Impact: New dependency on uuid package, new middleware in chain.
   - **Changed Redis key schema to sorted sets** — sliding window algorithm
     requires sorted sets, not simple strings. Affects memory profile.

   ### Delta Summary
   - 3 planned decisions: 2 as planned, 1 expanded scope
   - 2 surprises: both additive (no plan contradictions)
   - Design alignment: HIGH — implementation closely followed the plan
   Why good: Every decision shows BEFORE (question) and AFTER (answer + rationale).
   Surprises are documented with impact. Delta summary gives the big picture.
   The "Expanded scope" and "As planned" labels make evolution visible at a glance.
   </good>

   <bad>
   ## Decision Bridge

   | Decision | Status |
   |----------|--------|
   | Storage | Done |
   | Limit scope | Done |
   | 429 response | Done |
   Why bad: No before/after comparison. "Done" tells you nothing about what
   was decided or why. The entire point of the Decision Bridge is showing
   how thinking evolved.
   </bad>
   </examples>

4. **Handle partial stories gracefully**

   Not every change has all files. Show what exists and guide the user:

   | Missing | What to show | Suggestion |
   |---------|-------------|------------|
   | No design.md | Intent + Tasks only | "Design not captured. Was this a quick fix?" |
   | No tasks.md | Intent + Design only | "No tasks defined. Run `/whyspec:execute` to start." |
   | No context | Intent + Design + Tasks | "Reasoning not captured yet. Run `/whyspec:capture`." |
   | No intent (shouldn't happen) | Whatever exists | "Intent missing — this change may not have been planned with WhySpec." |
   | Tasks partially done | Show progress bar | "Progress: ███░░ 3/5 tasks — resume with `/whyspec:execute <name>`" |

## Tools

| Tool | When to use | When NOT to use |
|------|------------|-----------------|
| **Bash** | Run `whyspec show --json "<name>"` and `whyspec list --json` | Don't modify anything — this is read-only |
| **Read** | Read raw files if CLI output is insufficient or truncated | Don't read files the CLI already provided |

No AskUserQuestion — this is a read-only display skill. If change name is missing, use `whyspec list --json` and let the user select.

## Guardrails

- **Show all available phases** — always display intent, design, tasks, and context (if present). Don't skip sections.
- **Always show the Decision Bridge delta** — when both plan and context exist, the delta table is mandatory.
- **Handle missing files gracefully** — show what's available, note what's missing, suggest the command to fill gaps.
- **Read-only** — this skill displays information. It never modifies files.
- **Show completion status** — for tasks, show N/M complete. For the Decision Bridge, show resolved vs pending counts.
- **Tell the story, don't dump data** — organize output as a narrative arc, not a raw file concatenation.
