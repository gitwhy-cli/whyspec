<p align="center">
  <img src="https://raw.githubusercontent.com/gitwhy-cli/whyspec/main/assets/banner.png" alt="WhySpec — The Reasoning Layer" width="100%">
</p>

<p align="center">
  <strong>Built by <a href="https://gitwhy.dev">GitWhy</a> with ❤️</strong>
</p>

<p align="center">
  <a href="https://github.com/gitwhy-cli/whyspec/actions/workflows/ci.yml"><img src="https://github.com/gitwhy-cli/whyspec/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/gitwhy-cli/whyspec/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="license"></a>
  <a href="https://discord.gg/2X5X5XeFyT"><img src="https://img.shields.io/badge/discord-join-5865F2?logo=discord&logoColor=white" alt="Discord"></a>
</p>

**Spec-driven development that captures reasoning.**

A spec-driven context engineering framework for AI coding agents like Claude Code, Cursor, Copilot, and more.

## Our Vision

> Code tells you **what** was built. Tests tell you **how** it works. Only reasoning tells you **why** it exists.

- **Plan before coding** — surface decisions upfront
- **Capture after coding** — record what actually happened
- **Track the delta** — see what changed and what surprised you

In an era where AI writes most of the code, the human contribution isn't the syntax — it's the judgment. WhySpec preserves that judgment so it survives beyond the chat session that created it.

## See it in action

```
You: /whyspec-plan add-jwt-auth
AI:  Created .gitwhy/changes/add-jwt-auth/
     ✓ intent.md  — why this change exists
     ✓ design.md  — approach + 3 decisions to make
     ✓ tasks.md   — verification-first checklist
     Decision Bridge: 3 open questions to resolve.

You: /whyspec-execute add-jwt-auth
AI:  Implementing with full context...
     ✓ 1. Add token verification middleware
     ✓ 2. Create login endpoint with bcrypt
     ✓ 3. Wire up protected routes
     All tasks complete! 3 decisions resolved.

You: /whyspec-capture add-jwt-auth
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
# Then use /whyspec-plan in Claude Code or Cursor, or $whyspec-plan in Codex
```

That's it. WhySpec teaches your AI agent to plan before coding and capture reasoning after.

## Docs

→ [Getting Started](docs/getting-started.md): first steps<br>
→ [Commands](docs/commands.md): slash commands & skills<br>
→ [CLI](docs/cli.md): terminal reference<br>
→ [Concepts](docs/concepts.md): Decision Bridge, context IDs, philosophy<br>
→ [Supported Agents](docs/supported-tools.md): agent integrations & install paths<br>
→ [Workflows](docs/workflows.md): common patterns<br>
→ [GitWhy Integration](docs/gitwhy.md): SaaS platform & team sharing

## Cross-Agent Support

| AI Agent | Integration | How |
|---------|------------|-----|
| **Claude Code** | Native skills | `.claude/skills/whyspec-*/SKILL.md` |
| **Cursor** | Slash commands | `.cursor/commands/whyspec-*.md` |
| **Codex CLI** | Native skills + project instructions | `~/.codex/skills/whyspec-*` + `AGENTS.md` |
| **GitHub Copilot** | Project instructions | `AGENTS.md` |
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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, testing, and PR guidelines.

## License

[MIT](LICENSE) -- free forever. Go capture some reasoning.
