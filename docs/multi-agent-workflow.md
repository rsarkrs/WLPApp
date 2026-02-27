# Multi-Agent Delivery Workflow (Project-Level)

This document defines the repository's canonical multi-agent operating model for delivery phases.

## Canonical policy decisions

1. **Approvals policy:** `0` required approvals for autonomous mode (aligned with active ruleset), while required checks remain mandatory.
2. **Required status checks on `main`:**
   - `naming-convention`
   - `Dedicated QA Phase`
   - `Reviewer Agent Gate`
   - `Domain Review Gate`

## Agent lanes

- **Builder Agent:** implements scoped tasks and opens PRs.
- **Reviewer Agent:** validates mergeability + check health (`Reviewer Agent Gate`).
- **Domain Reviewer Agent:** validates cross-doc/schema/QA parity (`Domain Review Gate`).
- **Release Agent:** coordinates post-merge release train checks on `main`.

## Backlog item schema (required fields)

Each agent task (issue/PR) must include:
- `phase`: roadmap phase id (for example `Phase 2`).
- `lane`: `builder|reviewer|domain-reviewer|release`.
- `owner`: responsible agent/team.
- `depends_on`: linked blocking issues/PRs.
- `definition_of_done`: verifiable checklist copied from roadmap phase.
- `handoff_artifacts`: links to handoff docs under `docs/handoffs/`.

## PR requirements

Every PR must include:
- Phase ID and scope boundary.
- DoD checklist completion status.
- Handoff artifact links when contract/schema/QA behavior is touched.

## Release-train rule

After merges to `main`, run the release train workflow to summarize:
- merged PR set
- QA gate status
- rollout blockers and follow-up tasks
