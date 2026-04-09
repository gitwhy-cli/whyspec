<p align="center">
  <img src="assets/banner.png" alt="WhySpec — The Reasoning Layer" width="100%">
</p>

<p align="center">
  <strong>Built by <a href="https://gitwhy.dev">GitWhy</a></strong>
</p>

<p align="center">
  <a href="https://github.com/gitwhy-cli/whyspec/actions/workflows/ci.yml"><img src="https://github.com/gitwhy-cli/whyspec/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/gitwhy-cli/whyspec/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="license"></a>
  <a href="https://discord.gg/2X5X5XeFyT"><img src="https://img.shields.io/badge/discord-join-5865F2?logo=discord&logoColor=white" alt="Discord"></a>
</p>

**Spec-driven development that captures reasoning.**

A spec-driven context engineering framework for AI coding agents like Claude Code, Cursor, Copilot, and more.

AI agents write code fast. But when the session closes, the reasoning evaporates. The prompt, the rejected alternatives, the trade-offs. All that survives is the diff. WhySpec captures the rest.

## See it in action

```
You: /whyspec:plan add-jwt-auth
AI:  Created .gitwhy/changes/add-jwt-auth/
     ✓ intent.md  — why this change exists
     ✓ design.md  — approach + 3 decisions to make
     ✓ tasks.md   — verification-first checklist
     Decision Bridge: 3 open questions to resolve.

You: /whyspec:execute add-jwt-auth
AI:  Implementing with full context...
     ✓ 1. Add token verification middleware
     ✓ 2. Create login endpoint with bcrypt
     ✓ 3. Wire up protected routes
     All tasks complete! 3 decisions resolved.

You: /whyspec:capture add-jwt-auth
AI:  Decision Bridge resolved:
     ✓ Token storage: httpOnly cookie (XSS > CSRF)
     ✓ Hashing: bcrypt (Node.js ecosystem)
     ⚠ SURPRISE: Added 2FA (security review)
     Saved to ctx_a1b2c3d4.md
```

## Install

```bash
npm install -g @gitwhy-cli/whyspec
```

## Quick Start

```bash
cd your-project
whyspec init                        # Set up WhySpec
# Then use /whyspec:plan in Claude Code, or /whyspec-plan in Cursor
```

That's it. WhySpec teaches your AI agent to plan before coding and capture reasoning after.

## How It Works

**1. Plan** — Before coding, declare intent and surface decisions that need to be made.

```
whyspec plan "add-jwt-auth"    ->   .gitwhy/changes/add-jwt-auth/
                                      intent.md   (why this change exists)
                                      design.md   (approach + decisions to make)
                                      tasks.md    (verification-first checklist)
```

**2. Execute** — Code with full context. The agent reads your plan and works through tasks.

```
whyspec execute "add-jwt-auth"  ->  Returns intent + design + tasks as context
```

**3. Capture** — After coding, record the reasoning. Resolve the Decision Bridge.

```
whyspec capture "add-jwt-auth"  ->  .gitwhy/changes/add-jwt-auth/ctx_a1b2c3d4.md
                                      Decisions Made + Surprises + Trade-offs
```

## The Decision Bridge

WhySpec's core differentiator. It tracks how reasoning **evolves** from intent to outcome:

```
BEFORE (plan):                           AFTER (capture):
  ## Decisions to Make                     ## Decisions Made
  - [ ] Token storage:                     - [x] Token storage: httpOnly cookie
        cookie vs localStorage?                  -- XSS protection outweighs CSRF
  - [ ] Hashing: bcrypt vs argon2?         - [x] Hashing: bcrypt
                                                 -- Better library support
                                           SURPRISE: Added 2FA (not in plan)
                                                 -- Security review required it
```

The plan **predicts** decisions. The capture **records** decisions. The delta shows what was anticipated, what changed, and what was surprising.

## Commands

| Command | Description |
|---------|-------------|
| `whyspec init` | Initialize WhySpec in your project |
| `whyspec plan <name>` | Declare intent and plan decisions before coding |
| `whyspec execute <name>` | Implement from plan with full reasoning context |
| `whyspec capture <name>` | Save the reasoning behind what was built |
| `whyspec show <name>` | View full story with Decision Bridge delta |
| `whyspec search <query>` | Search past decisions and reasoning |
| `whyspec debug <name>` | Debug with the scientific method |
| `whyspec list` | List all active changes |
| `whyspec status <name>` | Detailed status for a change |
| `whyspec template <type>` | Get a raw file template |

All commands support `--json` for agent consumption (CLI-as-oracle pattern).

## Cross-Tool Support

| AI Tool | Integration | How |
|---------|------------|-----|
| **Claude Code** | Native skills | `.claude/skills/whyspec-*/SKILL.md` |
| **Cursor** | Slash commands | `.cursor/commands/whyspec-*.md` |
| **GitHub Copilot** | Project instructions | `AGENTS.md` |
| **Codex CLI** | Project instructions | `AGENTS.md` |
| **Windsurf** | Project instructions | `AGENTS.md` |
| **Cline** | Project instructions | `AGENTS.md` |
| **Amazon Q** | Project instructions | `AGENTS.md` |
| **RooCode** | Project instructions | `AGENTS.md` |

Run `whyspec init` and select your tools. WhySpec generates the right config for each.

## Works With

WhySpec is complementary to existing AI coding tools. It fills the reasoning gap they leave open.

| Tool | What it owns | WhySpec adds |
|------|-------------|--------------|
| **OpenSpec** | Planning before code | Reasoning capture *after* code |
| **GSD** | Deep planning + execution | Decision Bridge: plan vs outcome tracking |
| **gstack** | Sprint lifecycle (review, QA, ship) | Persistent WHY behind each change |

WhySpec works **alongside** all three. Use them for planning and execution. Use WhySpec for reasoning.

## GitWhy Integration

WhySpec is the open-source reasoning layer. [GitWhy](https://gitwhy.dev) is the SaaS platform that aggregates reasoning across repos and teams.

WhySpec contexts (`ctx_<id>.md`) use the GitWhy format — zero conversion needed. Your local reasoning files work with `git why log` and GitWhy cloud out of the box.

```
Solo (default):     .gitwhy/ gitignored, private local reasoning
Team (opt-in):      Remove from .gitignore, reasoning visible in PRs
Enterprise:         Keep gitignored + push to GitWhy cloud
```

## Philosophy

Code tells you **what** was built. Tests tell you **how** it works. Only reasoning tells you **why** it exists.

In an era where AI writes most of the code, the human contribution isn't the syntax — it's the judgment. WhySpec preserves that judgment so it survives beyond the chat session that created it.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, testing, and PR guidelines.

## License

[MIT](LICENSE) -- free forever. Go capture some reasoning.
