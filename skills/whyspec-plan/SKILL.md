---
name: whyspec-plan
description: Plan a change by declaring intent, design, and tasks before coding. Use when the user wants to plan what to build, capture decisions that need to be made, or set up the Decision Bridge before implementation.
---

Plan a change — create intent.md, design.md, and tasks.md with the Decision Bridge.

When ready to implement, run `/whyspec-execute`

---

**Input**: A change name (kebab-case) or description of what to build.

**Steps**

1. **Ask forcing questions before anything else**

   Do NOT create any files yet. Use the **AskUserQuestion tool** to ask these questions — they shape the entire plan:

   First ask:
   > "What problem does this solve? Who feels this pain today?"

   Then, building on their answer:
   > "What constraints exist? (technical limits, timeline, dependencies, things that can't change)"

   Finally:
   > "How will you know it works? What does success look like?"

   If the user provides a rich description upfront that already answers these, you may condense to one clarifying question. But never skip entirely.

2. **Create the change folder**

   Derive a kebab-case name from the user's input (e.g., "add user authentication" → `add-user-auth`).

   ```bash
   whyspec plan --json "<name>"
   ```

   Parse the JSON response:
   - `path`: The change directory (e.g., `.gitwhy/changes/add-auth/`)
   - `templates`: Template content for intent.md, design.md, tasks.md
   - `context`: Project context from config.yaml (constraints for you — do NOT copy into files)
   - `rules`: Project-specific rules (constraints for you — do NOT copy into files)

   If a change with that name already exists, use **AskUserQuestion** to ask: continue the existing change, or create a new one with a different name?

3. **Create intent.md**

   Write to `<path>/intent.md`. Populate using the user's answers to the forcing questions:

   ```markdown
   ## Why This Change Exists

   [Problem statement — from forcing question 1. Be specific about who feels the pain.]

   ## What It Enables

   [Capabilities this unlocks. What becomes possible that wasn't before?]

   ## Decisions to Make

   - [ ] [Decision 1: option A vs option B?]
   - [ ] [Decision 2: approach X vs approach Y?]
   - [ ] [Decision 3: ...]

   These checkboxes form the "before" side of the Decision Bridge.
   They will be resolved during /whyspec-capture after implementation.

   ## Constraints

   [From forcing question 2 — technical limits, non-negotiables, dependencies]

   ## Success Looks Like

   [From forcing question 3 — observable outcomes, acceptance criteria]

   ## Assumptions

   [What we're assuming is true but haven't verified]
   ```

   **IMPORTANT**: The "Decisions to Make" checkboxes are the Decision Bridge. Every design choice that isn't settled yet MUST be listed here. These get resolved in the context file after implementation.

4. **Create design.md**

   Write to `<path>/design.md`:

   ```markdown
   ## Approach

   [Chosen technical direction — 2-3 sentences on the high-level strategy]

   ## Trade-off Matrix

   | Option | [Criterion 1] | [Criterion 2] | [Criterion 3] |
   |--------|---------------|---------------|---------------|
   | Option A | ... | ... | ... |
   | Option B | ... | ... | ... |

   ## Architecture

   [ASCII diagram showing the design — components, data flow, boundaries]

   ## Questions to Resolve

   - [ ] [Open question needing an answer before or during coding]
   - [ ] [Another open question]

   ## Risks & Unknowns

   - [What could go wrong]
   - [What we don't know yet]

   ## Dependencies

   - [External libraries, APIs, services, other teams' work]
   ```

5. **Create tasks.md**

   Write to `<path>/tasks.md`. **Define verification FIRST** — goal-backward planning means you know what success looks like before listing tasks:

   ```markdown
   ## Verification

   What proves this change works — defined BEFORE tasks:

   - [ ] [Verification criterion 1 — e.g., "all auth tests pass"]
   - [ ] [Verification criterion 2 — e.g., "login flow works end-to-end"]

   ## Tasks

   - [ ] Task 1: [description]
     verify: [how to verify this specific task]
   - [ ] Task 2: [description]
     verify: [verification step]
   - [ ] Task 3: [description]
     verify: [verification step]
   ```

   Each task should be small enough for one atomic commit. Include a `verify:` line where meaningful.

6. **Show summary**

   Display:

   ```
   ## Plan Created: <name>

   <path>/
     intent.md    — WHY: problem, constraints, success criteria
     design.md    — HOW: approach, trade-offs, decisions to make
     tasks.md     — WHAT: verification criteria + implementation checklist

   Decisions to make: N pending
   Questions to resolve: N open
   Tasks: N defined

   Ready to implement? Run /whyspec-execute
   ```

**Guardrails**

- **Ask forcing questions FIRST** — never create files before asking. The questions shape the plan quality.
- **Don't implement code** — this skill creates plan files only. Implementation happens in `/whyspec-execute`.
- **Don't skip "Decisions to Make"** — every unsettled design choice must be a checkbox. These are the Decision Bridge. If the user hasn't mentioned trade-offs, ask: "What decisions haven't been made yet?"
- **Use CLI-as-oracle** — always call `whyspec plan --json` to create the folder. Don't create paths or generate IDs manually.
- **Apply `context` and `rules` as constraints** — they guide your writing but must NOT appear in the output files.
- **Verification before tasks** — in tasks.md, define what "done" looks like before listing the work to do.
- **Don't over-design** — if the user describes a small fix, create proportionally small plan files. Not every change needs a full trade-off matrix.
