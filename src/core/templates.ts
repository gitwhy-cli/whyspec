/**
 * File templates for WhySpec change artifacts.
 * Templates for: intent.md, design.md, tasks.md, context (SaaS XML format), debug.md
 *
 * The context template MUST match GitWhy SaaS XML format exactly.
 * See: gitwhy/.claude/skills/gitwhy/SKILL.md
 */

/** Template for intent.md — declares intent before coding. */
export function intentTemplate(changeName: string): string {
  return `# Intent: ${changeName}

## Why This Change Exists
<!-- Problem statement: what pain or gap does this address? -->

## What It Enables
<!-- Capabilities or outcomes this change unlocks -->

## Decisions to Make
<!-- Checkbox list of pending decisions (the Decision Bridge, "before" side) -->
- [ ]

## Constraints
<!-- Technical or business constraints -->

## Success Looks Like
<!-- Acceptance criteria: how do we know this is done? -->

## Assumptions
<!-- What we're assuming is true -->
`;
}

/** Template for design.md — technical approach with trade-offs. */
export function designTemplate(changeName: string): string {
  return `# Design: ${changeName}

## Approach
<!-- Chosen technical direction -->

## Trade-off Matrix
<!-- Rows = options, Columns = evaluation criteria -->
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
|        |      |      |          |

## Architecture
<!-- ASCII diagram of the design -->

## Questions to Resolve
<!-- Open questions before coding -->
- [ ]

## Risks & Unknowns
<!-- What could go wrong -->

## Dependencies
<!-- External dependencies -->
`;
}

/** Template for tasks.md — implementation checklist with goal-backward verification. */
export function tasksTemplate(changeName: string): string {
  return `# Tasks: ${changeName}

## Verification
<!-- What proves this works? Defined FIRST (goal-backward from GSD) -->
- [ ]

## Tasks
<!-- Implementation checklist with sub-tasks -->
- [ ]
`;
}

/**
 * Context template in GitWhy SaaS XML format.
 * This is what agents fill in when capturing reasoning after coding.
 * The CLI parses this XML and renders it into rich markdown for storage.
 */
export function contextTemplate(options?: {
  title?: string;
  agent?: string;
  tags?: string;
}): string {
  const title = options?.title ?? "Short title of what was done";
  const agent = options?.agent ?? "claude-code (model)";
  const tags = options?.tags ?? "keyword1, keyword2";

  return `<context>
  <title>${title}</title>
  <story>
    Phase 1 — Setup:
    What was asked, what was done, challenges faced, how they were resolved.

    Phase 2 — Implementation:
    Technical details, decisions made during coding, problems solved.
  </story>
  <reasoning>
    Why this approach was chosen.

    <decisions>
      - Decision — rationale
    </decisions>

    <rejected>
      - Alternative — why rejected
    </rejected>

    <tradeoffs>
      - Trade-off accepted — justification
    </tradeoffs>
  </reasoning>
  <files>
    path/to/file — new — Description
    path/to/other — modified — Description
  </files>
  <agent>${agent}</agent>
  <tags>${tags}</tags>
  <verification>Test/build results</verification>
  <risks>Open questions or risks</risks>
</context>
`;
}

/** Template for debug.md — structured debugging process. */
export function debugTemplate(bugName: string): string {
  return `# Debug: ${bugName}

## Symptoms
<!-- Expected vs actual behavior -->
**Expected:**

**Actual:**

**Error Messages:**

**Reproduction Steps:**
1.

**Timeline:** When did this start?

## Hypotheses
<!-- 3+ falsifiable hypotheses with "what would prove this wrong?" -->
1. **Hypothesis:**
   **Disproof:**

2. **Hypothesis:**
   **Disproof:**

3. **Hypothesis:**
   **Disproof:**

## Investigation
<!-- Evidence trail: what was tested, what was found -->

## Root Cause
<!-- The verified root cause. No fix without root cause (Iron Law). -->

## Fix
<!-- What was done to fix the issue -->

## Prevention
<!-- How to avoid this in the future -->
`;
}

/** Returns a template by type name. */
export function getTemplate(
  type: "intent" | "design" | "tasks" | "context" | "debug",
  name = ""
): string {
  switch (type) {
    case "intent":
      return intentTemplate(name);
    case "design":
      return designTemplate(name);
    case "tasks":
      return tasksTemplate(name);
    case "context":
      return contextTemplate({ title: name || undefined });
    case "debug":
      return debugTemplate(name);
  }
}
