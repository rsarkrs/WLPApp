#!/usr/bin/env bash
set -euo pipefail

# Bootstrap an Android Trusted Web Activity shell project for WLPApp.
# Requires: Java 17+, Android SDK command-line tools, Node/npm.

APP_ID="${APP_ID:-com.wlpapp.twa}"
APP_NAME="${APP_NAME:-WLPApp}"
HOST_URL="${HOST_URL:-https://example.com}"
LAUNCHER_NAME="${LAUNCHER_NAME:-wlpapp-android}"
OUTPUT_DIR="${OUTPUT_DIR:-android/twa}"
DRY_RUN="${DRY_RUN:-0}"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required but was not found in PATH." >&2
  exit 1
fi

if [ -d "$OUTPUT_DIR" ] && [ "$(ls -A "$OUTPUT_DIR" 2>/dev/null || true)" != "" ]; then
  echo "Output directory '$OUTPUT_DIR' is not empty. Refusing to overwrite." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

cat <<INFO
Bootstrapping TWA project with:
  APP_ID=$APP_ID
  APP_NAME=$APP_NAME
  HOST_URL=$HOST_URL
  LAUNCHER_NAME=$LAUNCHER_NAME
  OUTPUT_DIR=$OUTPUT_DIR
  DRY_RUN=$DRY_RUN
INFO

BWRAP_COMMAND=(
  npx @bubblewrap/cli@latest init
  "--manifest=$HOST_URL/manifest.webmanifest"
  "--directory=$OUTPUT_DIR"
  "--packageId=$APP_ID"
  "--name=$APP_NAME"
  "--launcherName=$LAUNCHER_NAME"
)

if [ "$DRY_RUN" = "1" ]; then
  printf 'DRY RUN: %q ' "${BWRAP_COMMAND[@]}"
  printf '\n'
  exit 0
fi

"${BWRAP_COMMAND[@]}"

cat <<NEXT_STEPS

TWA bootstrap complete.
Next steps:
1) cd $OUTPUT_DIR
2) npx @bubblewrap/cli@latest build
3) Configure signing (keystore/alias/password)
4) Build signed AAB/APK for internal testing

See docs/mobile/android-studio-testing.md and docs/mobile/play-store-submission-runbook.md.
NEXT_STEPS
