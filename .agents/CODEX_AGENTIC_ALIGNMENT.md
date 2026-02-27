# Codex Agentic Alignment for `.agents`

This document cross-references the current WLPApp skill set against Codex agentic skill expectations (clear triggers, minimal context loading, deterministic workflow, validation evidence, and constrained outputs) and records repo-specific upgrades.

## Current-state review summary

### Strengths already present
- Every skill has frontmatter (`name`, `description`) and a purpose-focused title.
- Workflows are concise and command-oriented.
- Most skills include guardrails that encode local policy and risk limits.
- QA and PR skills define actionable command references.

### Gaps identified
| Gap | Why it matters for agentic execution | Resolution in this folder |
|---|---|---|
| Skill discovery required opening each file | Slows routing and increases wrong-skill risk | Added trigger/outcome index in `.agents/README.md` |
| No shared usage protocol across skills | Different operators may apply inconsistent sequencing | Added fast usage pattern with explicit minimal-skill selection |
| Config/rules files were not indexed with skills | Agents may update docs without touching runtime config/rules surfaces | Added a repo agent surface map (skills, docs, workflow config, issue schema, branch rules location) |
| No explicit alignment artifact | Hard to audit whether skills follow Codex-friendly patterns | Added this alignment document with review criteria + checklist |
| Maintenance expectations were implicit | Skills can drift from scripts/policies over time | Added maintenance section with update rules |

## Agent surface cross-reference (requested: config, agent, and rules files)

| Category | File(s) | Role in agentic system |
|---|---|---|
| Skill definitions | `.agents/wlp-phase-executor/SKILL.md` (and peer skill files) | Task routing, deterministic workflows, guardrails |
| Agent operating policy docs | `docs/multi-agent-workflow.md`, `docs/reviewer-agent-workflow.md` | Lane semantics, merge/check expectations, human vs autonomous policy |
| Agent runtime config | `.github/workflows/reviewer-agent-gate.yml` | Automated mergeability/check evaluation and sticky PR feedback |
| Agent intake config | `.github/ISSUE_TEMPLATE/agent-task.yml` | Structured issue fields (`phase`, `lane`, `definition_of_done`, etc.) |
| Ruleset location | GitHub branch protection / rulesets (external setting) | Enforces required checks + approval policy referenced by repo docs |
| Root AGENTS contract | `AGENTS.md` | Repository-wide instructions and execution baseline for all agent tasks |
| Codex config baseline doc | `.agents/CODEX_CONFIG_BASELINE.md` | Repo-local defaults and parity policy for Codex runtime configuration |
| Codex rules baseline doc | `.agents/CODEX_RULES_OF_ENGAGEMENT.md` | Explicit rules-of-engagement for deterministic, evidence-backed execution |
| Multi-agent implementation guide | `docs/codex-multi-agent-implementation.md` | Practical role handoffs, failure triage, and maintenance protocol |

## Codex-aligned operating model for WLPApp

### 1) Trigger-first selection
- Select skills using explicit task triggers (roadmap phase, rule changes, migration edits, QA triage, PR prep, auto-merge remediation).
- Use the smallest set of skills needed for the request.

### 2) Progressive disclosure
- Read only selected `SKILL.md` files.
- Load deeper references (policy docs/tests/scripts/config files) only when the chosen workflow requires them.

### 3) Deterministic execution + evidence
- Prefer command-backed verification over narrative claims.
- Keep outputs in the required format when defined by a skill.
- Report pass/fail status and blockers explicitly.

### 4) Guardrail enforcement
- Respect non-negotiables in each skill (e.g., fixture-first rule changes, PR naming conventions, partial index intent).
- Prefer least-risk remediations for operational triage workflows.

### 5) Config-doc parity
- When changing agent behavior, update both:
  1. The operational config surface (`.github/workflows/*`, issue templates, ruleset settings), and
  2. The corresponding skill/doc instructions (`.agents/*`, `docs/*`) so execution guidance stays accurate.

## Per-skill audit checklist

Use this when creating or revising any skill in `.agents`.

- **Trigger clarity**: Can an agent decide in <10 seconds whether to apply this skill?
- **Scope boundary**: Does the skill avoid doing adjacent concerns owned by another skill?
- **Workflow determinism**: Are steps ordered and executable without hidden assumptions?
- **Validation command(s)**: Are concrete checks or scripts listed?
- **Output contract**: Is expected handoff format documented if needed?
- **Guardrails**: Are risky shortcuts explicitly prohibited?
- **Drift resistance**: Are referenced paths/scripts/config surfaces still current in the repo?

## Recommended future enhancements
- Add an optional `inputs` section to each skill for required context (target phase, PR number, migration range, etc.).
- Add a shared “evidence template” snippet for command logs and remediation notes.
- Add revision metadata (`last-reviewed`, `owner`) if team governance for skills is introduced.
