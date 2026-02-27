# Reviewer Agent Workflow

This repository supports a two-agent PR model:

1. **Builder Agent** opens/updates the PR.
2. **Reviewer Agent** validates mergeability/check status and posts actionable feedback on the PR.

## What is configured in-repo

- Workflow: `.github/workflows/reviewer-agent-gate.yml`
- Trigger: `pull_request` (`opened`, `synchronize`, `reopened`, `ready_for_review`)
- Behavior:
  - Checks mergeability (`mergeable`, `mergeable_state`)
  - Checks failing/pending commit statuses and check runs
  - Posts or updates a sticky PR comment (`<!-- reviewer-agent-gate -->`)
  - Fails the workflow when merge is blocked or checks fail

## What you need to configure on your end (GitHub settings)

1. **Branch protection / ruleset** for `main`
   - Require status checks to pass before merging.
   - Add these required checks:
     - `PR Policy Checks / naming-convention`
     - `QA Gates / Dedicated QA Phase`
     - `Reviewer Agent Gate / Reviewer Agent Gate`
2. **Pull request approvals**
   - Keep/reinforce at least 1 required approval.
3. **Token permissions (if using external bot/app reviewers)**
   - Ensure the reviewer identity can read checks and write PR comments.

## Operating loop

- Builder Agent pushes fix commits.
- Reviewer Agent Gate auto-runs and refreshes a single feedback comment.
- When gate + required checks pass and approval policy is satisfied, PR is mergeable.

## Autonomous merge (practical minimal path)

1. Keep required checks on `main`:
   - `PR Policy Checks / naming-convention`
   - `QA Gates / Dedicated QA Phase`
   - `Reviewer Agent Gate / Reviewer Agent Gate`
2. Set required approvals to **0** (or keep >0 only if a bot with write access can submit APPROVED reviews).
3. Enable repository auto-merge.
4. Use `.github/workflows/auto-merge-controller.yml` to automatically enable squash auto-merge once all required checks are green.

This yields a fully autonomous builder+reviewer+merge loop without manual button presses.
