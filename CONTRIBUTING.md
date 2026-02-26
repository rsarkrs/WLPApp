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
