# Codex Rules of Engagement

Codified rules for agent execution in WLPApp, aligned to repository workflows and guardrails.

## Global rules
1. **Smallest-change rule:** implement only what the task requests.
2. **Evidence rule:** run command checks for touched areas.
3. **Parity rule:** docs/config/tests must stay in sync when behavior changes.
4. **No hidden assumptions:** state blockers and environment limitations explicitly.
5. **Deterministic output:** use stable, repeatable command sequences.

## Change-type rules

### Contract / policy changes
- Update fixtures/tests/docs together.
- Re-run domain review gate checks.

### Migration / schema changes
- Preserve naming, index, and constraint parity.
- Re-run migration and domain parity checks.

### PR workflow / gating changes
- Update workflow YAML and accompanying docs/agent instructions in the same PR.
- Confirm naming convention and required-check references remain accurate.

## Prohibited shortcuts
- Declaring CI pass without executing checks.
- Editing unrelated files to "clean up" during scoped tasks.
- Leaving agent docs stale after changing gate behavior.

## Enforcement references
- `.agents/wlp-pr-policy-enforcer/SKILL.md`
- `.agents/wlp-qa-gate-orchestrator/SKILL.md`
- `.agents/wlp-migration-parity-guardian/SKILL.md`
