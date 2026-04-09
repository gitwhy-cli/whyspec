# GitWhy Integration

WhySpec is the open-source reasoning layer. [GitWhy](https://gitwhy.dev) is the SaaS platform that aggregates reasoning across repos and teams.

## Compatibility

WhySpec contexts (`ctx_<id>.md`) use the GitWhy format — zero conversion needed. Your local reasoning files work with `git why log` and GitWhy cloud out of the box.

## Deployment Modes

```
Solo (default):     .gitwhy/ gitignored, private local reasoning
Team (opt-in):      Remove from .gitignore, reasoning visible in PRs
Enterprise:         Keep gitignored + push to GitWhy cloud
```

## What GitWhy Adds

| Feature | WhySpec (local) | GitWhy (cloud) |
|---------|----------------|----------------|
| Capture reasoning | ✓ | ✓ |
| Search decisions | Local repo only | Across all repos |
| Team visibility | Via git commits | Dashboard + API |
| Reasoning analytics | — | Decision patterns, coverage |
| PR integration | Manual | Automatic context in PRs |
