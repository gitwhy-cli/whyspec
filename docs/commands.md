# Commands

All commands support `--json` for agent consumption (CLI-as-oracle pattern).

## Reference

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

## Core Workflow

```bash
whyspec plan "add-jwt-auth"       # Plan: declare intent + surface decisions
whyspec execute "add-jwt-auth"    # Execute: code with full context
whyspec capture "add-jwt-auth"    # Capture: record reasoning + resolve decisions
```

## Inspection

```bash
whyspec show "add-jwt-auth"       # View full story with Decision Bridge delta
whyspec search "authentication"   # Search past decisions and reasoning
whyspec list                      # List all active changes
whyspec status "add-jwt-auth"     # Detailed status for a change
```

## Debugging

```bash
whyspec debug "login-broken"      # Debug with the scientific method
```

## JSON Output

Every command supports `--json` for programmatic consumption:

```bash
whyspec list --json               # Machine-readable output for AI agents
whyspec show "add-jwt-auth" --json
```

This is the **CLI-as-oracle** pattern — your AI agent can call WhySpec commands and parse structured output to inform its own decisions.
