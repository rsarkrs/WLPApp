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
- Android signing baseline: `.github/workflows/android-release-baseline.yml` (to be added if missing in current branch)

## Follow-up required for production release
1. Add Bubblewrap + Android project generation automation.
2. Add keystore handling, signed AAB generation, and artifact upload.
3. Add Play internal track upload with manual approval gate.
4. Add Android emulator smoke tests (launch + API reachability + planner flow).
