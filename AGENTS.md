# AGENTS.md

This file defines repository-wide operating instructions for Codex-style agents working in WLPApp.

## Purpose
- Route work through the smallest relevant skill/workflow.
- Keep edits deterministic, auditable, and policy-compliant.
- Maintain parity between runtime automation (`.github/workflows`) and documentation (`.agents`, `docs`).

## Source of truth order
1. Direct user task instructions.
2. This `AGENTS.md`.
3. Task-specific skills in `.agents/*/SKILL.md`.
4. Repository docs (`docs/*`) and workflow configs (`.github/*`).

## Required execution pattern
1. **Select minimal scope**: touch only files needed for the request.
2. **Load only relevant guidance**: read selected skill(s) and directly referenced files.
3. **Run validation commands** for changed surfaces.
4. **Report evidence**: include commands run and outcomes.
5. **Preserve parity**: if behavior changes, update both config and docs.

## Agent surface map
- Skills: `.agents/*/SKILL.md`
- Agent workflow docs: `docs/multi-agent-workflow.md`, `docs/reviewer-agent-workflow.md`
- Agent intake schema: `.github/ISSUE_TEMPLATE/agent-task.yml`
- Agent gates: `.github/workflows/reviewer-agent-gate.yml`, `.github/workflows/domain-review-gate.yml`, `.github/workflows/qa-gates.yml`
- PR policy checks: `.github/workflows/pr-policy.yml`

## Quality gates
- Keep PR titles policy-compliant with repository conventions.
- Do not claim checks passed unless command/workflow evidence exists.
- Prefer least-risk edits; avoid unrelated refactors.

## Handoff checklist
- What changed and why.
- Validation commands + pass/fail.
- Any remaining follow-up actions.
