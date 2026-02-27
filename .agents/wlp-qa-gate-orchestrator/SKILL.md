---
name: wlp-qa-gate-orchestrator
description: Run and interpret WLPApp QA gate layers in repository order. Use for pre-PR validation or CI-failure triage.
---

# WLP QA Gate Orchestrator

## Canonical command order
1. `npm run lint`
2. `npm run typecheck`
3. `npm run test:unit`
4. `npm run test:property`
5. `npm run test:integration`
6. `npm run test:contract`
7. `npm run coverage:check`
8. `npm run build`

## Workflow
1. Execute commands in order and stop only on hard failure.
2. Map failures to QA layer terminology from `docs/qa-phase.md`.
3. Provide minimal fix plan grouped by failing layer.
4. Re-run only failed-and-downstream layers after fixes.

## Output
- Per-command status
- Layer mapping
- Next fix actions
