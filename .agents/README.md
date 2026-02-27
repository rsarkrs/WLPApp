# WLPApp Agent Skills

Repository-local Codex skills for execution, QA, migration parity, and PR operations.

## Why this folder exists
The `.agents` directory provides task-specific workflows that map WLPApp conventions to Codex skill execution. Use these skills when a task matches the trigger conditions so work is faster, repeatable, and policy-compliant.

## Repo agent surface area (skills + config + rules)
This repo's agent operating model is split across these file types:

| Area | Purpose | Key files |
|---|---|---|
| Skills (`.agents/*/SKILL.md`) | Task-specific execution workflows and guardrails | `.agents/wlp-*/SKILL.md` |
| Agent workflow docs (`docs/`) | Lane model, handoffs, and runtime operating loops | `docs/multi-agent-workflow.md`, `docs/reviewer-agent-workflow.md` |
| Agent config (`.github/`) | Runtime automation wiring for agent checks and comments | `.github/workflows/reviewer-agent-gate.yml` |
| Agent intake schema (`.github/`) | Structured task creation for agent lanes | `.github/ISSUE_TEMPLATE/agent-task.yml` |
| Branch/rules policy (GitHub settings) | Required checks and approval policy enforced outside repo files | Referenced from `docs/reviewer-agent-workflow.md` |

If you change any workflow/rules behavior, update both the relevant config file and the matching skill/doc guidance in this folder.

## Skill index
| Skill | Primary trigger | Core outcome |
|---|---|---|
| `wlp-phase-executor` | Implementing a roadmap phase from `README.md` | Delivers phase-scoped artifacts with DoD verification |
| `wlp-contract-first-rules` | Rule/contract changes (BMR/TDEE/macros/units/errors) | Keeps fixtures, adapters, and policy docs synchronized |
| `wlp-qa-gate-orchestrator` | Pre-PR validation or CI triage | Runs QA layers in canonical order with failure mapping |
| `wlp-migration-parity-guardian` | Changes in `db/schema.models.md` or migrations | Preserves schema ↔ migration naming/index/constraint parity |
| `wlp-recipe-import-hardener` | Changes under `src/recipeImport` | Keeps ingestion resilient with deterministic dedupe + fallback guarantees |
| `wlp-pr-policy-enforcer` | Creating/updating PRs | Ensures branch/title/check compliance before merge claims |
| `wlp-auto-merge-triage` | Auto-merge failures or unstable mergeability states | Isolates root cause and applies least-risk remediation |

## Fast usage pattern
1. Choose the minimum skill set that covers the request.
2. Read only the selected `SKILL.md` files.
3. Follow workflow sections in order; do not skip guardrails.
4. Capture command evidence and outcomes in final reporting.

## Agentic alignment baseline
The current skill set now follows a shared agentic baseline documented in [`CODEX_AGENTIC_ALIGNMENT.md`](./CODEX_AGENTIC_ALIGNMENT.md):
- explicit trigger-based skill selection,
- lightweight but deterministic workflow steps,
- command-driven validation,
- constrained output formats for handoff quality,
- guardrails to reduce risky or non-compliant edits.

## Maintenance guidance
- Keep descriptions specific to *when* the skill should trigger.
- Prefer short workflows with concrete commands over prose.
- Update a skill immediately when associated repo paths, scripts, or policy docs change.
- If two skills begin to overlap, keep shared policy in this `README` and leave skill files narrowly scoped.
