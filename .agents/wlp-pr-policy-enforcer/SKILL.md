---
name: wlp-pr-policy-enforcer
description: Enforce WLPApp branch/PR naming, clean working tree, and compliant PR creation. Use before opening or updating PRs.
---

# WLP PR Policy Enforcer

## Workflow
1. Ensure clean working tree.
2. Enforce branch/title prefixes: `Fix|Feat|Chore|Docs|Refactor|Test|Perf/`.
3. Prefer `scripts/create_pr.sh` for compliant branch push + PR open.
4. Verify required checks and report blocking statuses.

## Commands
- `scripts/create_pr.sh`
- `gh pr checks <number>`

## Guardrails
- Never create non-compliant PR titles/branches.
- Never claim merge-ready without required checks state.
