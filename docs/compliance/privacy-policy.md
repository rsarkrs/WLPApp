# WLPApp Privacy Policy (Draft Baseline)

Last updated: YYYY-MM-DD

## Scope
This baseline policy covers the current WLPApp scaffold behavior and is intended to be completed before any Play Store production release.

## Data we process (current scaffold)
- Profile/goal values entered in the web app (stored in browser local storage in MVP mode).
- API request/response payloads required for planner, shopping, and metabolic computations.
- Operational logs for API health/diagnostics (`x-request-id`, route/status/timing).

## Data sharing
- No third-party advertising SDKs are integrated in the current scaffold.
- No external analytics provider is enabled by default.

## Retention
- Browser local data remains on the user device unless cleared by the user.
- Server-side retention policies must be defined before production rollout.

## User controls
- Users can clear browser local data through browser storage controls.
- API data deletion/export endpoints are not finalized in scaffold mode and must be implemented before production.

## Security
- Production deployments must use HTTPS/TLS.
- Secrets must be managed via provider secret stores (never committed to repo).

## Required pre-release follow-up
- Replace this draft with legal-reviewed policy content.
- Add contact email and company/legal identity details.
- Add jurisdiction-specific disclosures.
