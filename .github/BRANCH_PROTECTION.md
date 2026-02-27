# Branch Protection Rules (GitHub Settings)

This repository enforces naming conventions and merge gates via CI workflows.

To complete policy enforcement in GitHub, configure branch protection/ruleset for `main`:

1. Go to **Settings -> Rules -> Rulesets** (or Branch protection rule for `main`).
2. Target default branch (`main`).
3. Enable:
   - Require a pull request before merging
   - Dismiss stale approvals when new commits are pushed
   - Require status checks to pass before merging
4. Required approvals:
   - **Autonomous mode (canonical): `0` required approvals**
5. Add required status checks:
   - `naming-convention`
   - `Dedicated QA Phase`
   - `Reviewer Agent Gate`
   - `Domain Review Gate`
6. Optional hardening:
   - Require conversation resolution before merging
   - Restrict who can push to matching branches
   - Require linear history

## Naming Policy
PR titles and source branches must use one of:
- `Fix/...`
- `Feat/...`
- `Chore/...`
- `Docs/...`
- `Refactor/...`
- `Test/...`
- `Perf/...`
