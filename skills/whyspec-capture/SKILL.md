---
name: whyspec-capture
description: Capture reasoning after implementation — resolve the Decision Bridge by mapping planned decisions to actual outcomes and recording surprises. Use after coding to preserve the WHY behind what was built.
---

Capture reasoning — create a context file that resolves the Decision Bridge and preserves the full story.

View the complete story with `/whyspec-show`

---

**Input**: Optionally specify a change name. If omitted, auto-detect the most recently executed change.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Auto-detect the most recently executed change (look for changes with completed tasks)
   - If ambiguous, run `whyspec list --json` and use **AskUserQuestion** to select

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

   a. **Decisions to Make → Decisions Made**: For EACH checkbox from intent.md's "Decisions to Make", record:
      - What was decided
      - Why (the rationale — not just the choice, but the reasoning)
      - Any constraints that influenced the decision

   b. **Questions to Resolve → Answers**: For EACH question from design.md's "Questions to Resolve", record:
      - The answer that emerged during implementation
      - How it was determined

   c. **Capture Surprises**: Identify decisions made during implementation that were NOT in the original plan. Ask yourself:
      - "What did we decide that we didn't plan to decide?"
      - "What changed from the original design?"
      - "What unexpected requirements emerged?"
      These surprises are often the most valuable part of the context.

   If a planned decision was NOT made during implementation, note it as unresolved and ask the user.

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
         - [Planned decision] — [chosen option] — [rationale]
       </decisions>

       <rejected>
         - [Alternative not chosen] — [why it was rejected]
       </rejected>

       <tradeoffs>
         - [Trade-off accepted] — [what was gained vs lost]
       </tradeoffs>
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

   **Surprises** go in the `<story>` narrative AND as a clearly labeled section in `<reasoning>`:

   ```
   Surprises (decisions not in the original plan):
   - [Unexpected decision] — [why it was needed]
   - [Scope change] — [what triggered it]
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

**Guardrails**

- **Must read plan files FIRST** — never generate context without reading intent.md and design.md. The Decision Bridge requires mapping FROM plan TO outcome.
- **Every planned decision must be resolved** — if intent.md lists 5 "Decisions to Make", all 5 must appear in the context. Prompt the user for any that weren't addressed.
- **Never skip surprises** — unplanned decisions are the most valuable context. Actively search for them.
- **Capture reasoning, not summaries** — write "we chose X because Y outweighs Z in our constraints" not just "we used X." Full reasoning helps future developers understand the choice.
- **Use SaaS XML format exactly** — the `<context>` tags must match the GitWhy format so `git why log` and `git why push` work without conversion.
- **Include verification results** — what tests pass, what was manually verified. This grounds the context in evidence.
- **Don't fabricate rationale** — if you don't know why a decision was made, ask the user. Invented reasoning is worse than no reasoning.
- **One context per capture** — each `/whyspec-capture` invocation creates exactly one `ctx_<id>.md` file.
