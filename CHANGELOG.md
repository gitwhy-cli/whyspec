<!-- Release Notes Draft (for GitHub Release v0.1.0)

## WhySpec v0.1.0 — The Reasoning Layer for AI-Assisted Development

WhySpec captures WHY code was built the way it was, not just what or how.
It bridges the gap between AI coding tools and the decisions behind the code.

### Feature Highlights

- **6 CLI commands**: `init`, `plan`, `capture`, `execute`, `show`, `search`
  plus `debug`, `list`, `status`, `template`
- **Decision Bridge**: Track decisions from planning ("Decisions to Make")
  through implementation ("Decisions Made") with delta visualization
- **Cross-tool support**: Claude Code skills, Cursor slash commands,
  Copilot/Windsurf/Cline via AGENTS.md — one `whyspec init` covers all
- **GitWhy integration**: Context files (ctx_<id>.md) are fully compatible
  with the GitWhy CLI for cloud sync and team sharing
- **CLI-as-Oracle**: Every command supports `--json` for seamless agent
  consumption — AI tools can read structured output directly

### Installation

```bash
npm install -g @gitwhy-cli/whyspec
```

### Quick Start

```bash
cd your-project
whyspec init                    # Set up WhySpec + pick your AI tools
whyspec plan add-auth           # Declare intent before coding
# ... write code ...
whyspec capture add-auth        # Capture reasoning after coding
whyspec show add-auth           # View the full decision story
```

### Full Documentation

See [README.md](https://github.com/gitwhy-cli/whyspec#readme)

-->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-09

### Added

- **CLI framework** — Commander.js-based CLI with global `--json` flag for
  agent consumption (CLI-as-Oracle pattern)
- **`whyspec init`** — Interactive project setup with multi-tool picker
  (Claude Code, Cursor, Copilot, Windsurf, Cline, Aider), auto-generates
  skill files and AGENTS.md
- **`whyspec plan <name>`** — Create structured change plans with intent.md
  (WHY), design.md (HOW), and tasks.md (WHAT) using Decision Bridge pattern
- **`whyspec capture <name>`** — Capture reasoning context in GitWhy SaaS XML
  format with auto-detected commits, changed files, and Decision Bridge data
- **`whyspec execute <name>`** — Get execution context with task progress
  tracking (parsed checkbox items with completion percentage)
- **`whyspec show <name>`** — Display full change story with Decision Bridge
  delta visualization (planned → actual decisions)
- **`whyspec search <query>`** — Search past decisions with weighted scoring
  (title=100, reasoning=30, files=20) and domain filtering
- **`whyspec debug <name>`** — Structured debugging with scientific method
  template (symptoms, hypotheses, investigation, root cause, fix, prevention)
- **Decision Bridge** — Track decisions from planning phase ("Decisions to
  Make" checkboxes) through implementation ("Decisions Made") with surprise
  detection for unplanned decisions
- **Context ID format** — `ctx_` + 8 alphanumeric characters (FR-20),
  compatible with GitWhy CLI file walker
- **GitWhy format compatibility** — ctx_<id>.md files use bold-colon metadata
  headers and SaaS XML body, parseable by GitWhy's parseContextHeader
- **Claude Code adapter** — Generates 6 SKILL.md files for native slash
  command integration (/whyspec:plan, /whyspec:capture, etc.)
- **Cursor adapter** — Generates custom slash commands for Cursor IDE
- **AGENTS.md adapter** — Generates AGENTS.md for Copilot, Windsurf, Cline
- **Telemetry** — Anonymous usage telemetry with opt-out via
  `WHYSPEC_TELEMETRY=0` or config.yaml

[0.1.0]: https://github.com/gitwhy-cli/whyspec/releases/tag/v0.1.0
