---
name: whyspec-execute
description: Implement a planned change using intent and design as context. Use when the user wants to start implementing, continue work, or execute tasks from a WhySpec plan.
---

Implement a change — read the plan, work through tasks, commit atomically.

When all tasks are done, run `/whyspec-capture` to save your reasoning.

---

**Input**: Optionally specify a change name. If omitted, auto-detect or prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Auto-select if only one active change exists
   - If multiple changes exist, run `whyspec list --json` and use **AskUserQuestion** to let the user select

   Always announce: "Executing change: **<name>**"

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

   Read the full content of these files from the change folder:
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
   ...
   ```

5. **Implement tasks sequentially**

   For each pending task:

   a. Show: `Working on task N/M: <description>`
   b. Implement the code changes
   c. Mark task complete in tasks.md: `- [ ]` → `- [x]`
   d. Run the task's `verify:` check if one is defined
   e. Commit atomically — one commit per task or logical unit
   f. Continue to next task

   **Pause if:**
   - Task is unclear or ambiguous → use **AskUserQuestion** to clarify before implementing
   - Implementation reveals a design issue → suggest updating design.md, ask user how to proceed
   - Task contradicts the stated intent → flag the contradiction to the user
   - Error or blocker encountered → report what happened and wait for guidance
   - You're unsure about a "Decision to Make" from design.md → ask the user to resolve it

6. **On completion**

   When all tasks are done:

   ```
   ## Implementation Complete

   Change: <name>
   Progress: M/M tasks complete

   Completed:
   - [x] Task 1: description
   - [x] Task 2: description
   ...

   Ready to capture reasoning? Run /whyspec-capture
   ```

   If paused before completion:

   ```
   ## Implementation Paused

   Change: <name>
   Progress: N/M tasks complete

   Issue: <what caused the pause>

   Resume with: /whyspec-execute <name>
   ```

   **Always end with the capture prompt** — the reasoning is freshest right after implementation.

**Guardrails**

- **Read intent.md before coding** — every implementation decision should align with the stated intent and constraints.
- **Never skip tasks** — work through all tasks in order. If a task seems unnecessary, ask the user to remove it rather than silently skipping.
- **Commit atomically** — one commit per task or logical unit. Don't batch all changes into one commit.
- **Pause on unclear tasks** — don't guess at ambiguous requirements. Ask for clarification.
- **Pause on design issues** — if reality doesn't match the plan, stop and suggest design.md updates before continuing.
- **Mark checkboxes immediately** — update tasks.md after each task completion, not at the end.
- **Always prompt capture** — end every execution session (complete or paused) with the `/whyspec-capture` suggestion.
