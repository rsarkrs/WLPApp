---
name: wlp-contract-first-rules
description: Apply contract-first updates for metabolic rules, fixtures, and tests. Use when changing BMR/TDEE, caps, floors, macro allocation, units, or rule errors.
---

# WLP Contract-First Rules

## Use when
- Rule logic changes in metabolic/planning contracts.
- Unit/rounding/error behavior changes.

## Workflow
1. Update contract fixtures first (`tests/fixtures/metabolic-contract-fixtures.json`).
2. Update reference contract adapter/tests (`tests/qa/support/metabolic-contract.js`, QA tests).
3. Keep decisions aligned with `docs/decisions/rule-policies.md`.
4. Run: `test:unit`, `test:property`, `test:contract`.
5. Summarize behavior changes with exact error/rounding/unit implications.

## Guardrails
- Do not ship logic-only changes without fixture updates.
- Do not change error strings/codes without explicit policy note.
