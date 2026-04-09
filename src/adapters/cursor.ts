import {
  GeneratedFile,
  WHYSPEC_COMMANDS,
  COMMAND_DESCRIPTIONS,
  WhySpecCommand,
} from "./types.js";

/**
 * Generate the Cursor command instructions for each WhySpec command.
 * Cursor commands are plain markdown — no YAML frontmatter.
 */
function getCursorCommandContent(command: WhySpecCommand): string {
  switch (command) {
    case "plan":
      return `# WhySpec Plan

${COMMAND_DESCRIPTIONS.plan}

## Objective

Create a structured plan before coding — capturing intent, design decisions to make, and implementation tasks. This is the BEFORE side of the Decision Bridge.

## Workflow

1. Ask the developer 2-3 forcing questions:
   - "What problem does this solve?"
   - "What constraints exist?"
   - "How will you know it works?"

2. Call the WhySpec CLI to create the change folder:
   \`\`\`bash
   whyspec plan --json "<change-name>"
   \`\`\`

3. Parse the JSON response to get the folder path and templates.

4. Create three files in the change folder:
   - **intent.md** — Why this change exists, decisions to make, constraints, success criteria
   - **design.md** — Technical approach, trade-off matrix, architecture, questions to resolve
   - **tasks.md** — Verification criteria (defined FIRST), then implementation checklist

5. Each decision-to-make should be a checkbox: \`- [ ] Token storage: cookie vs localStorage?\`

## Important

- Always call the CLI first — it handles path creation and validation.
- Capture COMPLETE reasoning, not abbreviated summaries.
- The "Decisions to Make" section in design.md is the BEFORE side of the Decision Bridge.`;

    case "execute":
      return `# WhySpec Execute

${COMMAND_DESCRIPTIONS.execute}

## Objective

Implement a planned change using the plan files as context. Track progress through the task list and commit atomically.

## Workflow

1. Call the WhySpec CLI to get execution context:
   \`\`\`bash
   whyspec execute --json "<change-name>"
   \`\`\`

2. Parse the JSON response to get intent, design, tasks, and progress.

3. Read intent.md and design.md for WHY context — understand the goal before coding.

4. Work through tasks.md sequentially:
   - Show progress: "Working on task 3/7: <description>"
   - Implement the code changes
   - Mark each task complete: \`- [ ]\` → \`- [x]\` in tasks.md
   - Commit atomically (one commit per task or logical unit)

5. On completion, prompt: "Ready to capture reasoning? Run /whyspec-capture"

## Important

- Use intent.md as context while implementing — it contains the WHY.
- Track deviations from the plan — surprises are valuable for capture.
- Do not skip tasks or mark them done without implementing.`;

    case "capture":
      return `# WhySpec Capture

${COMMAND_DESCRIPTIONS.capture}

## Objective

After coding, capture the reasoning behind what was built — completing the Decision Bridge by recording which decisions were made and why.

## Workflow

1. Call the WhySpec CLI to get the capture template:
   \`\`\`bash
   whyspec capture --json "<change-name>"
   \`\`\`

2. Parse the JSON response to get the template, linked commits, and files changed.

3. Read intent.md and design.md from the change folder.

4. Create a context file with:
   - Map each "Decision to Make" from design.md → "Decisions Made" with rationale
   - Map each "Question to Resolve" → resolved answer
   - Capture "Surprises" — decisions NOT in the plan
   - Include story, rejected alternatives, trade-offs, verification, risks

## Important

- Include ALL decisions, not just the ones from the plan.
- Surprises (unplanned decisions) are the most valuable part of the capture.
- This completes the Decision Bridge: plan PREDICTED decisions, capture RECORDS them.`;

    case "show":
      return `# WhySpec Show

${COMMAND_DESCRIPTIONS.show}

## Objective

Display the full story of a change — from intent through design, tasks, and captured reasoning — with the Decision Bridge delta highlighted.

## Workflow

1. Call the WhySpec CLI to get the full change data:
   \`\`\`bash
   whyspec show --json "<change-name>"
   \`\`\`

2. Parse the JSON response containing intent, design, tasks, context, and Decision Bridge delta.

3. Display the change story in sections:
   - **Intent** — WHY (from intent.md)
   - **Design** — HOW (from design.md)
   - **Tasks** — WHAT (from tasks.md with completion status)
   - **Context** — REASONING (from captured context)
   - **Decision Bridge Delta** — Decisions to Make vs Decisions Made

## Important

- The Decision Bridge delta is the unique value — always show it.
- If context hasn't been captured yet, show intent + design + tasks and suggest running /whyspec-capture.`;

    case "search":
      return `# WhySpec Search

${COMMAND_DESCRIPTIONS.search}

## Objective

Find past decisions and reasoning across all changes — building institutional knowledge that improves future work.

## Workflow

1. Call the WhySpec CLI to search:
   \`\`\`bash
   whyspec search --json "<query>"
   \`\`\`

2. Parse the JSON response containing scored results with snippets.

3. Display results ranked by relevance:
   - Title matches score highest (100 points)
   - Reasoning/decision matches score next (30 points)
   - File path matches score lower (20 points)

4. For each result, show: title, change name, score, and a relevant snippet.

## Important

- Search covers both active changes and archived ones.
- Search also finds intent.md and design.md — not just captured contexts.
- Use this before starting new work: "Has anyone reasoned about this area before?"`;

    case "debug":
      return `# WhySpec Debug

${COMMAND_DESCRIPTIONS.debug}

## Objective

Investigate a bug using the scientific method — capturing symptoms, hypotheses, evidence, root cause, fix, and prevention. Searches past decisions for related context.

## Workflow

1. Call the WhySpec CLI to create a debug session:
   \`\`\`bash
   whyspec debug --json "<bug-description>"
   \`\`\`

2. Parse the JSON response to get the debug folder path and related past contexts.

3. Follow the scientific method:
   - **Symptoms** — Expected vs actual behavior, error messages, reproduction steps
   - **Related contexts** — Check past decisions in this area (from CLI response)
   - **Hypotheses** — Form 3+ falsifiable hypotheses with "what would prove this wrong?"
   - **Investigation** — Test each hypothesis with evidence gathering
   - **Root cause** — Prove the diagnosis BEFORE proposing a fix (Iron Law)
   - **Fix** — Apply the fix and verify
   - **Prevention** — How to prevent this class of bug in the future

4. Create debug.md with the full investigation trail.

5. On completion, prompt: "Ready to capture debug reasoning? Run /whyspec-capture"

## Important

- No fix without root cause — this is the Iron Law.
- Check related past contexts BEFORE forming hypotheses.
- The debug.md persists across sessions so investigation survives context resets.`;
  }
}

/**
 * Generate Cursor custom slash command files for all 6 WhySpec commands.
 *
 * Creates .cursor/commands/whyspec-<command>.md files — plain markdown
 * that Cursor discovers automatically as slash commands.
 *
 * @param projectRoot - Optional project root prefix for paths (default: "")
 * @returns Array of GeneratedFile objects
 */
export function generateCursorCommands(
  projectRoot: string = "",
): GeneratedFile[] {
  const prefix = projectRoot ? `${projectRoot}/` : "";

  return WHYSPEC_COMMANDS.map((command) => ({
    path: `${prefix}.cursor/commands/whyspec-${command}.md`,
    content: getCursorCommandContent(command) + "\n",
  }));
}
