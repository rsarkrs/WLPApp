---
name: wlp-phase-executor
description: Execute one WLPApp roadmap phase at a time with explicit Definition-of-Done, artifacts, and validation checks. Use when implementing any roadmap phase from README.
---

# WLP Phase Executor

## Use when
- User asks to implement "Phase X" work.
- Work spans roadmap deliverables and must be validated against DoD.

## Workflow
1. Read the target phase in `README.md` and extract scope + DoD.
2. Create a short implementation checklist (deliverables, ownership area, checks).
3. Implement only in-scope files; defer unrelated work as follow-ups.
4. Run applicable checks from `package.json` scripts.
5. Report completion against each DoD bullet as pass/fail.

## Required output format
- `In scope`
- `Out of scope`
- `Changed files`
- `Checks run`
- `DoD verification table`
