# Getting Started

## Install

```bash
npm install -g @gitwhy-cli/whyspec
```

## Quick Start

```bash
cd your-project
whyspec init                        # Set up WhySpec
# Then use /whyspec-plan in Claude Code and Cursor, or $whyspec-plan in Codex
```

That's it. WhySpec teaches your AI agent to plan before coding and capture reasoning after.

## How It Works

**1. Plan** — Before coding, declare intent and surface decisions that need to be made.

```
/whyspec-plan add-jwt-auth     ->   gitwhy/changes/add-jwt-auth/
                                      intent.md   (why this change exists)
                                      design.md   (approach + decisions to make)
                                      tasks.md    (verification-first checklist)
```

**2. Execute** — Code with full context. The agent reads your plan and works through tasks.

```
/whyspec-execute add-jwt-auth  ->   Returns intent + design + tasks as context
```

**3. Capture** — After coding, record the reasoning. Resolve the Decision Bridge.

```
/whyspec-capture add-jwt-auth  ->   gitwhy/changes/add-jwt-auth/ctx_a1b2c3d4.md
                                      Decisions Made + Surprises + Trade-offs
```

## What's Next

- Learn about the [Decision Bridge](concepts.md) — WhySpec's core differentiator
- See the full [Commands](commands.md) reference
- Set up your [AI tool integration](supported-tools.md)
