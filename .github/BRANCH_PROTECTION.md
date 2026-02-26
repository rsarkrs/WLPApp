# Branch Protection Rules (GitHub Settings)

This repository enforces naming conventions in CI via `.github/workflows/pr-policy.yml`.

To complete policy enforcement in GitHub, configure branch protection for `main`:

1. Go to **Settings -> Branches -> Add branch protection rule**.
2. Set branch name pattern to `main`.
3. Enable:
   - Require a pull request before merging
   - Require approvals (minimum 1)
   - Dismiss stale pull request approvals when new commits are pushed
   - Require status checks to pass before merging
4. Add required status check:
   - `naming-convention`
5. Optional hardening:
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
