---
name: wlp-auto-merge-triage
description: Diagnose and resolve auto-merge controller issues for PRs, including unstable/UNPROCESSABLE GitHub states and required-check timing races.
---

# WLP Auto-Merge Triage

## Workflow
1. Inspect PR state and checks (`gh pr view`, `gh pr checks`).
2. Inspect failing workflow logs with an explicit run id (non-interactive safe):
   - Get run id: `gh pr checks <pr-number>` or `gh run list --branch <branch> --limit 5`
   - View logs: `gh run view <run-id> --log-failed`
3. Classify issue:
   - required checks pending/failing
   - mergeability blocked/dirty
   - transient GraphQL unstable/UNPROCESSABLE
4. Apply least-risk fix (rerun, rebase, workflow patch, or manual enable).
5. Confirm `autoMergeRequest`/mergeability state after remediation.

## Output
- Root cause
- Evidence links/commands
- Corrective action
- Final merge readiness
