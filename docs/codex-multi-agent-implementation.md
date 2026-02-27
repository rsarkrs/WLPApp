# Codex Multi-Agent Implementation Guide (WLPApp)

This guide operationalizes multi-agent collaboration for this repository and complements:
- `docs/multi-agent-workflow.md`
- `docs/reviewer-agent-workflow.md`
- `AGENTS.md`

## Roles and responsibilities
- **Builder Agent:** implement scoped changes and provide command evidence.
- **Reviewer Agent:** evaluate mergeability and required-check health.
- **Domain Reviewer Agent:** verify policy/schema/QA parity.
- **Release Agent:** monitor post-merge release train outcomes.

## Standard handoff contract
Each handoff should include:
1. Scope and changed files.
2. Validation commands run and outcomes.
3. Risks, assumptions, and follow-ups.

## Coordination protocol
1. Builder opens/updates PR with scoped summary.
2. Reviewer gate evaluates merge/check state and posts actionable feedback.
3. Domain gate enforces parity expectations.
4. Auto-merge controller enables merge when required checks are green.

## Failure triage matrix
- **Policy check failed:** fix naming/title/policy constraints first.
- **QA gate failed:** address failing test/lint/build command directly.
- **Domain gate failed:** reconcile schema/contract/docs mismatch.
- **Mergeability blocked:** rebase/resolve conflicts and rerun checks.

## Metrics to monitor
- Time from PR open to mergeable state.
- Number of gate reruns per PR.
- Frequency of doc-config parity failures.

## Maintenance
When adding/removing gates or lanes, update in the same PR:
- workflow files under `.github/workflows/`
- this guide and other docs under `docs/`
- relevant `.agents` skills and root `AGENTS.md`
