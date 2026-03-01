# Android Release Path (Selected)

## Decision
WLPApp uses a **Trusted Web Activity (TWA)** wrapper as the packaging path for Android/Play Store.

## Why TWA
- Current product is a Next.js web application with PWA metadata already in place.
- TWA allows shipping to Play Store without duplicating business logic into a new native client yet.
- This keeps API contracts and backend behavior consistent across web/mobile distributions.

## Baseline CI support
- Build/quality gate: `.github/workflows/mobile-quality-gate.yml`
- Release baseline gate: `.github/workflows/deploy-production.yml`
- Android launch readiness gate: `.github/workflows/android-launch-readiness-gate.yml`
- Android signing preflight: `.github/workflows/android-release-baseline.yml`

## Current state
- Android shell bootstrap is automated via `scripts/bootstrap_twa_project.sh` and smoke-checked in CI.
- Launch readiness criteria are documented in `docs/mobile/android-launch-readiness.md`.
- Signing preflight now validates required secrets/docs and emits a decoded keystore artifact in CI for auditability.

## Follow-up required for production release
1. Generate signed AAB from the TWA project inside CI using Bubblewrap/Gradle.
2. Add Play Console internal track upload automation with manual approval gate.
3. Add Android emulator smoke tests (launch + API reachability + planner flow).
