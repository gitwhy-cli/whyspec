# Commands

Slash commands and skills for use inside your AI coding agent.

## Slash Commands

| Command | Tool | Description |
|---------|------|-------------|
| `/whyspec-plan <name>` | Claude Code | Declare intent and plan decisions before coding |
| `/whyspec-execute <name>` | Claude Code | Implement from plan with full reasoning context |
| `/whyspec-capture <name>` | Claude Code | Save the reasoning behind what was built |
| `/whyspec-show <name>` | Claude Code | View full story with Decision Bridge delta |
| `/whyspec-search <query>` | Claude Code | Search past decisions and reasoning |
| `/whyspec-debug <name>` | Claude Code | Debug with the scientific method |

### Cursor

| Command | Description |
|---------|-------------|
| `/whyspec-plan <name>` | Declare intent and plan decisions before coding |
| `/whyspec-execute <name>` | Implement from plan with full reasoning context |
| `/whyspec-capture <name>` | Save the reasoning behind what was built |

### Codex

Use `$whyspec-plan`, `$whyspec-execute`, and the other `$whyspec-*` commands after `whyspec init` installs the native Codex skills. Codex also reads `AGENTS.md` for repo-level instructions.

### Other Tools (Copilot, Windsurf, Cline, etc.)

Tools that read `AGENTS.md` will automatically use WhySpec commands via the CLI. No slash commands needed — the agent calls `whyspec plan`, `whyspec execute`, etc. directly.

## Core Workflow

```
You: /whyspec-plan add-jwt-auth
AI:  Created .gitwhy/changes/add-jwt-auth/
     ✓ intent.md  — why this change exists
     ✓ design.md  — approach + 3 decisions to make
     ✓ tasks.md   — verification-first checklist

You: /whyspec-execute add-jwt-auth
AI:  Implementing with full context...
     ✓ All tasks complete! 3 decisions resolved.

You: /whyspec-capture add-jwt-auth
AI:  Decision Bridge resolved.
     Saved to ctx_a1b2c3d4.md
```
