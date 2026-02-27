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
- Canonical autonomous mode: require `0` approvals and rely on required status checks; if human-review mode is desired, raise approvals in branch protection/rulesets.
- Prefer squash merge to keep history clean.

## GitHub Enforcement
- CI workflow `.github/workflows/pr-policy.yml` validates PR title and source branch prefixes.
- Configure GitHub branch protection for `main` as documented in `.github/BRANCH_PROTECTION.md`.

## Automation Helpers
- `scripts/bootstrap_github_auth.sh`: configures `origin` and validates GitHub auth using `gh` or `curl` + token fallback.
- `scripts/create_pr.sh`: validates naming policy, auto-renames non-compliant local branch names to `Chore/<sanitized-name>`, ensures the PR base tracking ref is fetched locally, pushes branch, and creates a PR via `gh` or GitHub API fallback.
- Recommended workflow: create commits first, then run `scripts/create_pr.sh` to enforce branch/PR naming policy before opening a PR.
- Required env for API fallback: `GITHUB_TOKEN` (or `GH_TOKEN`).

## Two-Agent PR Workflow
- Builder Agent: implements code and opens/updates PRs.
- Reviewer Agent: automated workflow `.github/workflows/reviewer-agent-gate.yml` checks mergeability/check status and posts actionable PR feedback.
- To enforce this gate, add `Reviewer Agent Gate / Reviewer Agent Gate` to required status checks in branch protection/rulesets.
- Setup and operating details: `docs/reviewer-agent-workflow.md`.
- Optional autonomous merge controller: `.github/workflows/auto-merge-controller.yml` can enable squash auto-merge once required checks pass.
