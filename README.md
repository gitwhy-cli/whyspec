# WhySpec

**The reasoning layer for AI-assisted development.**

WhySpec captures *WHY* code was built the way it was — not just what was built or how to build it.

> 67% of code is AI-generated. 0% of reasoning is preserved. WhySpec changes that.

## Install

```bash
npm install -g @gitwhy-cli/whyspec
```

## Quick Start

```bash
whyspec init                          # Set up WhySpec in your project
whyspec plan "add-jwt-auth"           # Declare intent before coding
whyspec execute "add-jwt-auth"        # Implement with context
whyspec capture "add-jwt-auth"        # Save your reasoning
whyspec show "add-jwt-auth"           # View the full story
whyspec search "token expiry"         # Find past decisions
whyspec debug "login-fails-safari"    # Debug with science
```

## The Decision Bridge

WhySpec tracks how reasoning **evolves** from intent to outcome:

```
BEFORE (plan):                           AFTER (capture):
  ## Decisions to Make                     ## Decisions Made
  - [ ] Token storage:                     - [x] Token storage: httpOnly cookie
        cookie vs localStorage?                  — XSS protection outweighs CSRF
  - [ ] Hashing: bcrypt vs argon2?         - [x] Hashing: bcrypt
                                                 — Better library support
                                           SURPRISE: Added 2FA (not in plan)
                                                 — Security review required it
```

The plan **predicts** decisions. The capture **records** decisions. The delta shows what was anticipated, what changed, and what was surprising.

## Commands

| Command | Purpose |
|---|---|
| `whyspec init` | Initialize WhySpec in your project |
| `whyspec plan <name>` | Create intent, design, and task templates |
| `whyspec execute <name>` | Get execution context from a plan |
| `whyspec capture <name>` | Capture reasoning after implementation |
| `whyspec show <name>` | View full story with Decision Bridge delta |
| `whyspec search <query>` | Search past decisions and reasoning |
| `whyspec debug <name>` | Structured debugging (scientific method) |
| `whyspec list` | List all active changes |
| `whyspec status <name>` | Detailed status for a change |
| `whyspec template <type>` | Get a raw file template |

All commands support `--json` for agent consumption (CLI-as-oracle pattern).

## Works With

WhySpec works alongside your existing AI coding tools:

- **Claude Code** — Native slash commands via `.claude/skills/`
- **Cursor** — Custom slash commands
- **GitHub Copilot** — Reads `AGENTS.md`
- **Codex CLI** — Reads `AGENTS.md`
- **Windsurf, Cline, Amazon Q, RooCode** — Via `AGENTS.md`

WhySpec is **complementary** to OpenSpec, GSD, and gstack — it fills the reasoning gap they leave open.

## Relationship to GitWhy

WhySpec is the open-source reasoning layer. [GitWhy](https://gitwhy.dev) is the SaaS platform that aggregates reasoning across repos and teams. WhySpec contexts (`ctx_<id>.md`) use the GitWhy format — zero conversion needed.

## License

MIT

---

<!-- GitHub repo topics: ai-coding, reasoning-layer, developer-tools, claude-code, cursor, ai-agents, decision-bridge, context-capture, whyspec, gitwhy, typescript, cli -->
