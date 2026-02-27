# Contributing Guidelines

## Branching & Pull Requests
- Do not push directly to `main`.
- Create a dedicated branch for each change.
- Open a Pull Request (PR) to merge into `main`.
- Keep PRs focused and small enough to review.

## Naming Convention (Required)
Use one of the following prefixes for branch names and PR titles:
- `Fix/...`
- `Feat/...`
- `Chore/...`
- `Docs/...`
- `Refactor/...`
- `Test/...`
- `Perf/...`

Examples:
- `Feat/meal-plan-constraint-engine`
- `Fix/calorie-floor-validation`
- `Chore/update-ci-lint-step`

## Commit Hygiene
- Write clear, imperative commit messages.
- Group related changes together.
- Avoid unrelated formatting-only noise in functional PRs.

## Merge Policy
- `main` is updated through reviewed PRs only.
- Require at least one approval before merge.
- Prefer squash merge to keep history clean.

## GitHub Enforcement
- CI workflow `.github/workflows/pr-policy.yml` validates PR title and source branch prefixes.
- Configure GitHub branch protection for `main` as documented in `.github/BRANCH_PROTECTION.md`.

## Automation Helpers
- `scripts/bootstrap_github_auth.sh`: configures `origin` and validates GitHub auth using `gh` or `curl` + token fallback.
- `scripts/create_pr.sh`: validates naming policy, auto-renames non-compliant local branch names to `Chore/<sanitized-name>`, ensures the PR base tracking ref is fetched locally, pushes branch, and creates a PR via `gh` or GitHub API fallback.
- Recommended workflow: create commits first, then run `scripts/create_pr.sh` to enforce branch/PR naming policy before opening a PR.
- Required env for API fallback: `GITHUB_TOKEN` (or `GH_TOKEN`).
