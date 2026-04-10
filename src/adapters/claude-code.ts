import {
  GeneratedFile,
  WHYSPEC_COMMANDS,
  COMMAND_DESCRIPTIONS,
  COMMAND_ARGUMENT_HINTS,
  WhySpecCommand,
} from "./types.js";

/**
 * Generate compact instructions for each WhySpec command.
 * Used by adapters that embed skill content (Codex, Claude Code skills).
 * The canonical full-length skills live in skills/whyspec-{cmd}/SKILL.md.
 */
export function getSkillInstructions(command: WhySpecCommand): string {
  switch (command) {
    case "plan":
      return `Plan a change — create intent.md, design.md, and tasks.md with the Decision Bridge.

When ready to implement, run \`/whyspec-execute\`

## Workflow

1. Parse what the user typed. If they gave a meaningful description, act immediately — do NOT
   ask generic questions like "What problem does this solve?" or "What constraints exist?"
   Only ask if ARGUMENTS is empty or genuinely ambiguous.

2. Call the CLI to create the change folder:
   \`\`\`bash
   whyspec plan --json "<change-name>"
   \`\`\`

3. Explore the codebase to understand the affected area before writing plan files.

4. Create three files in the change folder:
   - **intent.md** — Why this change exists, decisions to make, constraints, success criteria
   - **design.md** — Technical approach, trade-off matrix, architecture, questions to resolve
   - **tasks.md** — Verification criteria (defined FIRST), then implementation checklist

5. The "Decisions to Make" section in intent.md is the BEFORE side of the Decision Bridge.

## Important
- Act first, ask only when stuck. The user told you what they want.
- Ground plans in the actual codebase — read relevant files before writing.
- Every unsettled design choice must be a checkbox in "Decisions to Make".
- Scale the plan to the change — a typo fix gets 3 lines, not a trade-off matrix.`;

    case "execute":
      return `Implement a change — read the plan, work through tasks, commit atomically.

When all tasks are done, run \`/whyspec-capture\`

## Workflow

1. Call the CLI to get the execution context:
   \`\`\`bash
   whyspec execute --json "<change-name>"
   \`\`\`

2. Read intent.md and design.md BEFORE coding — understand the goal first.

3. Work through tasks.md sequentially:
   - Show progress: "Working on task 3/7: <description>"
   - Implement the code changes
   - Mark each task complete: \`- [ ]\` → \`- [x]\` in tasks.md
   - Run the task's verify: check
   - Commit atomically (one commit per task or logical unit)

4. If reality contradicts the design, STOP and flag it — don't silently override.

## Important
- Never skip the plan. Read intent.md before writing code.
- Commit atomically — one commit per task, not one giant commit.
- Pause on design contradictions — update the plan before continuing.`;

    case "capture":
      return `Capture reasoning — resolve the Decision Bridge and preserve the full story.

View the complete story with \`/whyspec-show\`

## Workflow

1. Call the CLI to get the capture template:
   \`\`\`bash
   whyspec capture --json "<change-name>"
   \`\`\`

2. Read intent.md and design.md for the Decision Bridge mapping.

3. Create ctx_<id>.md in GitWhy SaaS XML format:
   - Map each "Decision to Make" → "Decisions Made" with full rationale
   - Map each "Question to Resolve" → answer with reasoning
   - Capture "Surprises" — decisions NOT in the original plan

## Important
- Capture reasoning, not summaries. "We chose X because Y outweighs Z" not just "we used X."
- Every planned decision must be resolved. Prompt the user for any gaps.
- Surprises (unplanned decisions) are the most valuable part of the capture.`;

    case "show":
      return `Show the full story — intent, design, tasks, reasoning — with the Decision Bridge delta.

## Workflow

1. Call the CLI:
   \`\`\`bash
   whyspec show --json "<change-name>"
   \`\`\`

2. Display: Intent (WHY) → Design (HOW) → Tasks (WHAT) → Reasoning (AFTER)

3. Highlight the Decision Bridge Delta: planned vs actual decisions with rationale.

## Important
- The Decision Bridge delta is the core value — always show it.
- If context hasn't been captured, suggest running /whyspec-capture.`;

    case "search":
      return `Search reasoning — find past decisions and contexts across all changes.

## Workflow

1. Call the CLI:
   \`\`\`bash
   whyspec search --json "<query>"
   \`\`\`

2. Display results ranked by relevance with reasoning snippets — not just titles.

## Important
- Always show reasoning snippets, not just titles.
- Search includes plan files (intent.md, design.md), not just captured contexts.`;

    case "debug":
      return `Debug with scientific method. No fix without root cause.

## Workflow

1. Call the CLI to create a debug session:
   \`\`\`bash
   whyspec debug --json "<bug-description>"
   \`\`\`

2. Search past contexts first — check if this domain has been reasoned about before.

3. Follow the scientific method:
   - **Symptoms** — Expected vs actual, error messages, reproduction steps
   - **Hypotheses** — 3+ falsifiable claims with concrete tests
   - **Investigation** — Test one at a time, record evidence
   - **Root cause** — Prove diagnosis BEFORE proposing fix (Iron Law)
   - **Fix + Capture** — Minimal fix, then auto-capture reasoning

## Important
- No fix without root cause — the Iron Law is non-negotiable.
- Write debug.md incrementally — it persists across context resets.
- Always capture the investigation as a context file when resolved.`;
  }
}

export function generateClaudeCodeCommands(
  projectRoot: string = "",
): GeneratedFile[] {
  const prefix = projectRoot ? `${projectRoot}/` : "";

  return WHYSPEC_COMMANDS.map((command) => {
    const frontmatter = [
      "---",
      `description: ${COMMAND_DESCRIPTIONS[command]}`,
      `argument-hint: ${COMMAND_ARGUMENT_HINTS[command]}`,
      "---",
    ].join("\n");

    const instructions = getSkillInstructions(command);
    const invocationLine = `Invoke this command as \`/whyspec-${command}\`.`;

    return {
      path: `${prefix}skills/whyspec-${command}/SKILL.md`,
      content: `${frontmatter}\n\n${invocationLine}\n\n${instructions}\n`,
    };
  });
}
