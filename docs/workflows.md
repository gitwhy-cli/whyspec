# Workflows

Common patterns for using WhySpec in your development workflow.

## Plan → Execute → Capture

The core WhySpec loop:

```bash
whyspec plan "add-jwt-auth"       # Surface decisions before coding
whyspec execute "add-jwt-auth"    # Code with full context
whyspec capture "add-jwt-auth"    # Record what actually happened
```

**Why this order matters:** Planning surfaces decisions you'd otherwise make implicitly. Executing with that context keeps the agent focused. Capturing after records how reality diverged from the plan — the most valuable part.

## Debugging with WhySpec

```bash
whyspec debug "login-broken"      # Creates a structured debug session
```

The debug workflow uses the scientific method:
1. **Observation** — What's happening?
2. **Hypothesis** — Why might it be happening?
3. **Experiment** — How to verify?
4. **Result** — What did we learn?

## Reviewing Past Decisions

```bash
whyspec search "authentication"   # Find past reasoning about auth
whyspec show "add-jwt-auth"       # Full story with Decision Bridge delta
```

Use search when you need to understand why a past decision was made — especially useful when revisiting code months later or onboarding new team members.

## Team Workflows

### Solo (Default)

`.gitwhy/` is gitignored. Reasoning stays local and private.

### Team (Opt-in)

Remove `.gitwhy/` from `.gitignore`. Reasoning becomes visible in PRs — reviewers can see not just what changed, but why.

### Enterprise

Keep `.gitwhy/` gitignored but push to [GitWhy](https://gitwhy.dev) cloud. Reasoning is aggregated across repos and teams without cluttering your git history.
