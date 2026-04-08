/**
 * File templates for WhySpec plan command.
 * These match the PRD FR-12 structure.
 */

export function intentTemplate(changeName: string): string {
  return `# Intent: ${changeName}

## Why This Change Exists

<!-- What problem does this solve? What is the motivation? -->

## What It Enables

<!-- What capabilities or outcomes does this change provide? -->

## Decisions to Make

<!-- Checkbox list of pending decisions — the Decision Bridge (before side) -->
- [ ]

## Constraints

<!-- Technical or business constraints to work within -->

## Success Looks Like

<!-- Acceptance criteria — how will you know this is done? -->

## Assumptions

<!-- What are we assuming is true? -->
`;
}

export function designTemplate(changeName: string): string {
  return `# Design: ${changeName}

## Approach

<!-- Chosen technical direction -->

## Trade-off Matrix

<!-- Rows = options, Columns = evaluation criteria -->
| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
|        |      |      |         |

## Architecture

<!-- ASCII diagram of the design -->

## Decisions to Make

<!-- Checkbox list of design decisions to resolve -->
- [ ]

## Questions to Resolve

<!-- Open questions before coding -->

## Risks & Unknowns

<!-- What could go wrong? -->

## Dependencies

<!-- External dependencies -->
`;
}

export function tasksTemplate(changeName: string): string {
  return `# Tasks: ${changeName}

## Verification

<!-- What proves this works? Define FIRST (goal-backward from GSD) -->

## Tasks

<!-- Implementation checklist -->
- [ ]
`;
}

/**
 * SaaS-compatible XML context template (GitWhy format).
 * Matches the exact format from .claude/skills/gitwhy/SKILL.md
 */
export function contextTemplate(): string {
  return `<context>
  <title>Short title of what was done</title>
  <story>
    Phase-organized engineering journal. First-person, chronological.

    Phase 1 — Setup:
    What happened, challenges faced, how they were resolved.

    Phase 2 — Implementation:
    Technical details, decisions made during coding.
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
      - Trade-off — justification
    </tradeoffs>
  </reasoning>
  <files>
    path — action — description
  </files>
  <agent>agent-name (model)</agent>
  <tags>keyword1, keyword2</tags>
  <verification>Test/build results</verification>
  <risks>Open questions</risks>
</context>`;
}
