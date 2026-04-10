---
name: whyspec-show
description: Display the full story of a change — intent, design, tasks, and reasoning — with the Decision Bridge delta showing how decisions evolved from plan to implementation.
---

Show the full story — from intent through design, tasks, and reasoning — with the Decision Bridge delta.

---

**Input**: A change name. If omitted, prompt for available changes.

**Steps**

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
   - Use **AskUserQuestion** to let the user select

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

   If context hasn't been captured yet, show:
   ```
   ## Reasoning (AFTER)

   Not yet captured. Run /whyspec-capture to complete the story.
   ```

3. **Highlight the Decision Bridge Delta**

   When both plan files and context exist, display the evolution:

   ```
   ## Decision Bridge

   | Decision | Planned (Before) | Actual (After) | Status |
   |----------|-------------------|----------------|--------|
   | Token storage | cookie vs localStorage? | httpOnly cookie — XSS protection | Resolved |
   | Hashing algorithm | bcrypt vs argon2? | bcrypt — better library support | Resolved |
   | Session strategy | JWT vs server-side? | JWT — no session store needed | Resolved |
   | [Unresolved item] | X vs Y? | — | Pending |

   ### Surprises (not in original plan)

   - Added 2FA — security review required it
   - Added rate limiting on login — discovered during load testing
   ```

   The delta is the most valuable output of `/whyspec-show` — it reveals how thinking evolved from plan to reality.

**Guardrails**

- **Show all available phases** — always display intent, design, tasks, and context (if present). Don't skip sections even if they're short.
- **Always show the Decision Bridge delta** — when both plan and context exist, the delta table is mandatory. It's the core differentiator.
- **Handle missing files gracefully** — if some files don't exist, show what's available and note what's missing. Suggest the appropriate command to fill gaps.
- **Read-only** — this skill displays information. It never modifies files.
- **Show completion status** — for tasks, always show N/M complete. For the Decision Bridge, show how many decisions were resolved vs pending.
