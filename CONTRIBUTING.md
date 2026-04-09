# Contributing to WhySpec

Thanks for your interest in contributing! WhySpec is the reasoning layer for AI-assisted development, and we welcome contributions of all kinds.

## Development Setup

```bash
git clone https://github.com/gitwhy-cli/whyspec.git
cd whyspec
npm install
npm run build
npm test
```

**Requirements:** Node.js 20+, npm 10+

## Project Structure

```
whyspec/
  src/
    cli/
      index.ts            # CLI entry point (commander setup)
    commands/
      init.ts             # whyspec init
      plan.ts             # whyspec plan
      execute.ts          # whyspec execute
      capture.ts          # whyspec capture
      __tests__/          # Command tests
    core/                 # Business logic (context, templates, scoring)
    utils/                # Shared utilities
    adapters/
      claude-code.ts      # Claude Code skill generator
      cursor.ts           # Cursor slash command generator
      agents-md.ts        # AGENTS.md generator (Copilot, Windsurf, etc.)
      types.ts            # Shared adapter types and command descriptions
  skills/
    whyspec-plan/         # Claude Code skill: plan
    whyspec-execute/      # Claude Code skill: execute
    whyspec-capture/      # Claude Code skill: capture
    whyspec-show/         # Claude Code skill: show
    whyspec-search/       # Claude Code skill: search
    whyspec-debug/        # Claude Code skill: debug
  dist/                   # Compiled output (gitignored)
```

## Testing

```bash
npm test                  # Run all tests (vitest)
npx vitest run            # Same thing
npx vitest --watch        # Watch mode
npx vitest run src/commands/__tests__/plan.test.ts  # Single file
```

**Test conventions:**
- Test files live in `__tests__/` directories next to the code they test
- Name test files `<module>.test.ts`
- Use `describe`/`it` blocks with clear descriptions
- Mock file system operations; don't write to real directories

## Code Style

- **TypeScript strict mode** — no `any` types
- **ESM** — use `import`/`export`, not `require`
- **Zod** — for runtime validation of CLI inputs and JSON responses
- **Prettier + ESLint** — run `npm run format` and `npm run lint` before committing

## How to Add a New Command

1. Create `src/commands/your-command.ts` with a handler function
2. Wire it into `src/cli/index.ts` using Commander's `.command()` API
3. Support `--json` flag for structured output (CLI-as-oracle pattern)
4. Add tests in `src/commands/__tests__/your-command.test.ts`
5. Update `WHYSPEC_COMMANDS` and `COMMAND_DESCRIPTIONS` in `src/adapters/types.ts` if the command should be exposed to AI agents

## How to Add a New Adapter

1. Create `src/adapters/your-tool.ts` exporting a `generateYourTool()` function
2. Return `GeneratedFile[]` (see `src/adapters/types.ts`)
3. Register the adapter in the `whyspec init` flow (`src/commands/init.ts`)
4. Add tests in `src/adapters/adapters.test.ts`

## Pull Request Guidelines

**Branch naming:** `feat/description`, `fix/description`, or `docs/description`

**Commit messages:** Use conventional commits:
- `feat: add template command`
- `fix: handle missing change folder`
- `docs: update README cross-tool table`
- `test: add capture command tests`

**Before submitting:**
- [ ] `npx tsc --noEmit` passes (zero type errors)
- [ ] `npm test` passes (all tests green)
- [ ] `npm run lint` passes
- [ ] New commands have tests
- [ ] New adapters have tests

## Questions?

Open an issue or start a discussion on GitHub.
