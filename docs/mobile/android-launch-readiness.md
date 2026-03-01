# Android Launch Readiness (Go/No-Go Criteria)

This document defines the exact point where WLPApp is considered ready for Google Play launch.

## Launch decision rule
WLPApp is launch-ready only when **all** sections below are green.

## 1) CI and quality gates
- [ ] `Dedicated QA Phase` workflow is passing on `main`.
- [ ] `Lighthouse PWA + Performance` workflow is passing on `main`.
- [ ] `Android TWA Bootstrap Smoke` workflow is passing on `main`.
- [ ] `Compliance Docs Presence` workflow is passing on `main`.

## 2) Android packaging and signing
- [ ] Android shell project is generated from `npm run android:twa:init` without errors.
- [ ] Signed AAB is produced using production keystore values.
- [ ] AAB installs and launches successfully on at least one physical Android device.

## 3) Play Console readiness
- [ ] Internal testing track configured.
- [ ] Minimum 3 internal testers can install and run the app from Play internal track.
- [ ] App listing assets uploaded (icon, feature graphic, screenshots, descriptions).

## 4) Policy and compliance
- [ ] Public Privacy Policy URL is published and linked in Play Console.
- [ ] Data Safety declaration completed and aligned with repository checklist.
- [ ] Content rating completed.

## 5) Functional acceptance
- [ ] Profile setup flow passes on device.
- [ ] Weekly planner generation/regeneration passes on device.
- [ ] Shopping list generation/export passes on device.
- [ ] No blocker defects in internal testing sign-off notes.

## Recommended launch checkpoint artifact
Create and store a release note file under `artifacts/` with:
- app version
- commit SHA
- workflow run links
- known issues (if any)
- launch owner sign-off
