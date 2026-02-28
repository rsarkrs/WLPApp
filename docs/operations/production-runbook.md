# Production Runbook (Phase 12 Baseline)

## Scope
Operational baseline for API/web deployment, alert review, and rollback in WLPApp.

## Metrics and alert thresholds
Monitor the `/metrics` API endpoint and infrastructure provider telemetry.

- **Planner/API latency**
  - Alert if p95 latency > 1500 ms for 10 minutes.
- **Import success rate**
  - Alert if import success rate < 95% over rolling 30 minutes.
- **5xx errors**
  - Alert if status5xx > 1% of total requests in a 10-minute window.
- **DB readiness**
  - Alert immediately if `/health/ready` returns non-200 for > 2 consecutive checks.

## Pre-deploy checklist
1. Run `npm run qa:release` and review generated `artifacts/release-readiness-checklist.md`.
2. Verify `main` required checks are green.
3. Confirm `.env.production.example` variables are set in deployment platform secrets.

## Rollback playbook
1. Identify previous stable release tag.
2. Redeploy API/web from previous stable image/build.
3. Verify `/health/live`, `/health/ready`, and `/metrics` return expected signals.
4. Open incident follow-up documenting root cause and corrective action.

## Migration note
Current scaffold stores no production schema migrations in runtime path; when DB migrations are introduced, append migration rollback/roll-forward steps in this runbook.
