# Supported Agents

WhySpec works with any AI coding agent. Run `whyspec init` and select your agents — WhySpec generates the right config for each.

## Integrations

| AI Agent | Integration | How |
|---------|------------|-----|
| **Claude Code** | Project commands | `.claude/commands/whyspec:*.md` |
| **Cursor** | Slash commands | `.cursor/commands/whyspec-*.md` |
| **Codex CLI** | Native skills + project instructions | `~/.codex/skills/whyspec-*` + `AGENTS.md` |
| **GitHub Copilot** | Project instructions | `AGENTS.md` |
| **Windsurf** | Project instructions | `AGENTS.md` |
| **Cline** | Project instructions | `AGENTS.md` |
| **Amazon Q** | Project instructions | `AGENTS.md` |
| **RooCode** | Project instructions | `AGENTS.md` |

## How It Works

### Claude Code (Project Commands)

WhySpec generates Claude project commands for the slash-command UI:

```
.claude/commands/
├── whyspec:plan.md
├── whyspec:execute.md
├── whyspec:capture.md
├── whyspec:show.md
├── whyspec:search.md
└── whyspec:debug.md
```

Use `/whyspec:plan`, `/whyspec:execute`, etc. directly in Claude Code. The gray suggestion text comes from each command file's frontmatter.

### Cursor (Slash Commands)

WhySpec generates Cursor command files:

```
.cursor/commands/
├── whyspec-plan.md
├── whyspec-execute.md
└── whyspec-capture.md
```

Use `/whyspec-plan`, `/whyspec-execute`, etc. in Cursor.

### Codex CLI (Native Skills)

WhySpec installs native Codex skills into the global Codex skills directory:

```
~/.codex/skills/
├── whyspec-plan/
├── whyspec-execute/
├── whyspec-capture/
├── whyspec-show/
├── whyspec-search/
└── whyspec-debug/
```

Use `$whyspec-plan`, `$whyspec-execute`, etc. in Codex after restarting it.

If Codex hides `.gitwhy/` after a reload, WhySpec also creates a visible `gitwhy/` helper workspace during init for Codex users.

### AGENTS.md (Copilot, Windsurf, Cline, etc.)

For tools that read project instructions from `AGENTS.md`, WhySpec appends instructions that teach the agent to use WhySpec commands via the CLI.
