# Concepts

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

## What Gets Created

```
whyspec/
├── changes/
    ├── add-jwt-auth/
    │   ├── intent.md          # why
    │   ├── design.md          # approach + decisions
    │   ├── tasks.md           # verification checklist
    │   └── ctx_a1b2c3d4.md    # captured reasoning
    ├── migrate-to-postgres/
    │   ├── intent.md
    │   ├── design.md
    │   ├── tasks.md
    │   └── ctx_f3e4d5c6.md
    └── add-rate-limiting/
        ├── intent.md
        └── design.md          # planning phase
```

### File Types

| File | Created by | Purpose |
|------|-----------|---------|
| `intent.md` | `whyspec plan` | Why this change exists |
| `design.md` | `whyspec plan` | Approach + decisions to make |
| `tasks.md` | `whyspec plan` | Verification-first checklist |
| `ctx_<id>.md` | `whyspec capture` | Captured reasoning — decisions made, surprises, trade-offs |

## Context IDs

Each captured context gets a unique ID: `ctx_` + 8 alphanumeric characters (e.g., `ctx_a1b2c3d4`). These IDs link reasoning to specific changes and are compatible with the [GitWhy](gitwhy.md) SaaS format.

## CLI-as-Oracle

Every WhySpec command supports `--json` for agent consumption. This means your AI coding agent can call WhySpec programmatically and parse structured output to inform its own decisions — WhySpec acts as an oracle the agent queries, not a gate it passes through.

## Philosophy

Code tells you **what** was built. Tests tell you **how** it works. Only reasoning tells you **why** it exists.

In an era where AI writes most of the code, the human contribution isn't the syntax — it's the judgment. WhySpec preserves that judgment so it survives beyond the chat session that created it.
