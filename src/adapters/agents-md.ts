import {
  GeneratedFile,
  WHYSPEC_COMMANDS,
  COMMAND_DESCRIPTIONS,
} from "./types.js";

/**
 * Generate the AGENTS.md content.
 *
 * This single file is read by GitHub Copilot, Windsurf, Cline, Amazon Q,
 * RooCode, Codex CLI, OpenCode, and other AI coding agents that look for project-root
 * instruction files.
 */
function getAgentsMdContent(): string {
  // Build the commands table
  const commandRows = WHYSPEC_COMMANDS.map(
    (cmd) => `| \`whyspec ${cmd} --json\` | ${COMMAND_DESCRIPTIONS[cmd]} |`,
  ).join("\n");

  return `# WhySpec — The Reasoning Layer for AI Coding

WhySpec captures WHY code was built the way it was, not just what was built or how to build it. It tracks how reasoning evolves from intent to outcome through the **Decision Bridge**: the plan PREDICTS decisions before coding, the capture RECORDS decisions after coding, and the delta reveals what was anticipated, what changed, and what was surprising.

## Commands

| Command | Description |
|---------|-------------|
${commandRows}

## How to Use WhySpec (CLI-as-Oracle Pattern)

WhySpec follows the CLI-as-oracle pattern: call the CLI with \`--json\` and parse the structured response. The CLI handles path creation, validation, and project context. You handle content generation.

### Calling the CLI

Always use the \`--json\` flag when calling WhySpec commands:

\`\`\`bash
whyspec plan --json "add-jwt-auth"
\`\`\`

Example JSON response:

\`\`\`json
{
  "path": "whyspec/changes/add-jwt-auth",
  "templates": {
    "intent": "## Why This Change Exists\\n...",
    "design": "## Approach\\n...",
    "tasks": "## Verification\\n..."
  },
  "context": "Project context from config.yaml",
  "rules": "Project-specific rules from config.yaml"
}
\`\`\`

Parse the response and use the returned paths and templates to create or read files.

### Reading CLI Output

\`\`\`bash
# Get execution context (reads plan files)
whyspec execute --json "add-jwt-auth"

# Get capture template with linked commits
whyspec capture --json "add-jwt-auth"

# View full change story with Decision Bridge delta
whyspec show --json "add-jwt-auth"

# Search past decisions
whyspec search --json "token expiry"

# Create debug session with related contexts
whyspec debug --json "login-fails-safari"
\`\`\`

## Example Workflow: Plan, Execute, Capture

### Step 1: Plan (before coding)

\`\`\`bash
whyspec plan --json "add-jwt-auth"
\`\`\`

Ask the developer forcing questions, then create three files:
- **intent.md** — Why this change exists, decisions to make, success criteria
- **design.md** — Technical approach, trade-offs, questions to resolve
- **tasks.md** — Verification criteria first, then implementation checklist

The "Decisions to Make" section in design.md is the BEFORE side of the Decision Bridge:
\`\`\`markdown
## Decisions to Make
- [ ] Token storage: cookie vs localStorage?
- [ ] Hashing algorithm: bcrypt vs argon2?
- [ ] Session model: JWT vs server-side?
\`\`\`

### Step 2: Execute (during coding)

\`\`\`bash
whyspec execute --json "add-jwt-auth"
\`\`\`

Read intent.md and design.md for context. Work through tasks.md, marking each task complete. Commit atomically per task.

### Step 3: Capture (after coding)

\`\`\`bash
whyspec capture --json "add-jwt-auth"
\`\`\`

Record the reasoning behind what was built:
- Map each "Decision to Make" → "Decision Made" with rationale
- Capture surprises — decisions NOT in the original plan
- Include rejected alternatives and trade-offs

The AFTER side of the Decision Bridge:
\`\`\`markdown
## Decisions Made
- [x] Token storage: httpOnly cookie — XSS protection outweighs CSRF complexity
- [x] Hashing: bcrypt — Better library support in Node.js ecosystem
- [x] JWT (stateless) — No session store needed for MVP
SURPRISE: Added 2FA — Security review required it (not in original plan)
\`\`\`

## The Decision Bridge

The Decision Bridge is WhySpec's core differentiator. It tracks how decisions evolve:

| Phase | What it captures | File |
|-------|-----------------|------|
| **Before** (plan) | Decisions TO MAKE — questions, options, trade-offs | design.md |
| **After** (capture) | Decisions MADE — choices, rationale, surprises | ctx_*.md |
| **Delta** (show) | What changed — anticipated vs actual vs surprising | computed |

Use \`whyspec show --json "<name>"\` to see the full Decision Bridge delta for any change.

## Debugging with WhySpec

WhySpec debug sessions follow the scientific method:

1. **Symptoms** — Expected vs actual behavior
2. **Past context search** — Check if anyone reasoned about this area before
3. **Hypotheses** — 3+ falsifiable hypotheses
4. **Investigation** — Test each hypothesis with evidence
5. **Root cause** — Prove diagnosis before fixing (Iron Law: no fix without root cause)
6. **Fix and capture** — Apply fix, then capture the debugging reasoning

---

*This file is read by GitHub Copilot, Windsurf, Cline, Amazon Q, RooCode, Codex CLI, Google Antigravity, OpenCode, and other AI coding agents that support project-level instruction files.*
`;
}

/**
 * Generate AGENTS.md for AI tools that read project-root instruction files.
 *
 * Targets: GitHub Copilot, Windsurf, Cline, Amazon Q, RooCode, Codex CLI, OpenCode.
 * Single comprehensive file with CLI-as-oracle pattern, example workflow,
 * and Decision Bridge explanation.
 *
 * @param projectRoot - Optional project root prefix for paths (default: "")
 * @returns Array of GeneratedFile objects (always 1 file)
 */
export function generateAgentsMd(
  projectRoot: string = "",
): GeneratedFile[] {
  const prefix = projectRoot ? `${projectRoot}/` : "";

  return [
    {
      path: `${prefix}AGENTS.md`,
      content: getAgentsMdContent(),
    },
  ];
}
