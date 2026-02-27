# Codex Configuration Baseline (Repo-Local)

This document provides the repository-local baseline derived from Codex configuration guidance for predictable autonomous execution.

## Goals
- Deterministic behavior during implementation and review loops.
- Minimal operator intervention for routine tasks.
- Explicit safety boundaries and reproducible command evidence.

## Recommended runtime profile
- **Execution mode:** non-interactive autonomous (`approval_policy: never`).
- **Filesystem scope:** repository-limited writes unless task requires broader scope.
- **Network:** enabled only when needed for dependencies/docs.
- **Shell:** POSIX-compatible commands with explicit working directory.

## Repository defaults
- Work from repo root: `/workspace/WLPApp`.
- Validate relevant lanes before handoff with commands that exist in this repo:
  - policy (branch/PR naming convention): enforced by `.github/workflows/pr-policy.yml` in PR checks
  - domain parity: enforced by `.github/workflows/domain-review-gate.yml` in PR checks
  - QA: run the canonical local sequence used by CI (`npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:property`, `npm run test:integration`, `npm run test:contract`, `npm run coverage:check`, `npm run build`)
- Preserve conventional commit/PR naming required by CI gates.

## Configuration parity rule
Whenever agent behavior or gate expectations change, update all of:
1. Runtime config/workflow files in `.github/`.
2. Agent instructions in `AGENTS.md` and `.agents/*`.
3. Workflow docs in `docs/*`.

## Suggested local config keys (template)
Use this as a starting point for local Codex client profiles:

```toml
# Example template only; adapt to your Codex client version.
model = "gpt-5-codex"
approval_policy = "never"
sandbox_mode = "workspace-write"

[projects."/workspace/WLPApp"]
trust_level = "trusted"
```

> Keep this template synchronized with active team policy and CI gate expectations.
