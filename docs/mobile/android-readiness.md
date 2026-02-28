# Android / Play Store Readiness Baseline

## Why this exists
WLPApp currently ships as web + API scaffolds. To support a Google Play distribution path, we need a mobile packaging track (PWA/TWA or React Native shell) with explicit readiness criteria.

## Current baseline (implemented)
- PWA metadata: `manifest.webmanifest` with app name, colors, and install display mode.
- Service worker shell caching baseline (`sw.js`) to support offline fallback behavior.
- Mobile web-app meta tags in Next.js app shell (`viewport-fit`, theme color, install-capable hints).

## Gaps before Play Store submission
1. **Installability and asset quality**
   - Replace scaffold SVG icons with production PNG icon set (192/512, maskable variants).
   - Add screenshots/feature graphic assets required by Play Console.
2. **Runtime hardening**
   - Add API auth/session model suited for mobile distribution.
   - Add crash/error telemetry and privacy-safe analytics.
3. **Offline/low-connectivity behavior**
   - Define offline-first behavior for profile/plan editing and sync conflict strategy.
   - Add explicit user messaging when API is unavailable.
4. **Packaging/distribution path**
   - Selected path: **TWA wrapper** (see `docs/mobile/android-release-path.md`).
   - Baseline signing workflow: `.github/workflows/android-release-baseline.yml`.
5. **Policy/compliance**
   - Provide privacy policy and data deletion flow.
   - Complete Play Data Safety declarations.

## Recommended next implementation steps
1. Add a dedicated `Phase 13` track in the plan for mobile packaging and compliance deliverables.
2. Add Lighthouse PWA quality checks to CI for installability/regression checks (current baseline threshold: PWA >= 0.6 while installability hardening is in progress).
3. Implement provider-backed telemetry and error monitoring for production mobile sessions.

## Execution guides
- Android Studio testing: `docs/mobile/android-studio-testing.md`
- Play Store submission: `docs/mobile/play-store-submission-runbook.md`
