# WhySpec

The reasoning layer for AI-assisted development. Open-source CLI under `@gitwhy-cli/whyspec`.

## Build & Test

```bash
npm run build          # Compile TypeScript
npm test               # Run vitest
npx tsc --noEmit       # Type check
npm run lint           # ESLint
```

## Project Structure

- `src/cli/` — CLI entry point (Commander.js)
- `src/commands/` — Command handlers (plan, capture, execute, show, search, debug, list, status, template)
- `src/core/` — Business logic (search scoring, templates, config, storage, context)
- `src/utils/` — Shared utilities (slugify, git, telemetry)
- `src/adapters/` — Tool adapters (Claude Code, Cursor, AGENTS.md)
- `skills/` — Claude Code SKILL.md files (6 commands)

## Key Patterns

- **CLI-as-oracle:** Every command supports `--json` for agent consumption.
- **Decision Bridge:** `design.md` "Decisions to Make" → `ctx_<id>.md` "Decisions Made".
- **Context format:** `ctx_<id>.md` uses GitWhy SaaS XML format (`<context>` tags).
- **Context ID:** `ctx_` + 8-char alphanumeric (e.g., `ctx_a1b2c3d4`).
