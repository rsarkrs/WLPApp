# Android Studio Testing Guide (TWA/PWA path)

This guide explains how to test WLPApp on Android Studio before Play Store upload.

## Prerequisites
- Android Studio (latest stable)
- Android SDK Platform 34+
- AVD (Pixel device profile is fine)
- Node.js 20+
- WLPApp repository cloned locally

## 1) Start WLPApp services locally
From repo root:

```bash
npm install
npm run start:api
npm run start:web
```

Default URLs:
- Web: `http://localhost:3000`
- API: `http://localhost:4000`

## 2) Run with Android emulator networking
Inside Android emulator browser, use host alias:
- `http://10.0.2.2:3000`

`10.0.2.2` maps to your host machine `localhost` for Android emulator.

## 3) Installability smoke test
1. Open `http://10.0.2.2:3000` in Chrome (emulator).
2. Confirm manifest loads (`/manifest.webmanifest`).
3. Confirm service worker registers in app logs/DevTools.
4. Add app to home screen when install prompt/menu is available.

## 4) Functional smoke tests
- Profile and Goals:
  - Save one member and optional second member.
  - Toggle imperial/metric and recalculate calories.
- Weekly Planner:
  - Generate plan, regenerate, and click meal cards to swap meals.
  - Use cuisine and ingredient exclusion filters.
- Recipes Used:
  - Select a recipe and verify ingredients/instructions render.
- Shopping List:
  - Generate list and confirm grouped totals render.

## 5) API dependency checks
From browser or curl:
- `GET /health`
- `GET /health/live`
- `GET /health/ready`
- `GET /metrics`

## 6) Lighthouse mobile check (repo-aligned)
From repo root:

```bash
npm run qa:mobile
```

Note: this command requires Chrome/Chromium installed on the host machine.

## 7) Exit criteria before Play internal testing
- App launches in emulator without console/runtime errors.
- Core planner/shopping/profile smoke tests pass.
- Lighthouse gate passes configured thresholds.
- Privacy/Data Safety docs are present and updated.
