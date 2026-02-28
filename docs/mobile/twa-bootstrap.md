# TWA Bootstrap Guide (Automated Shell Init)

WLPApp now includes an automation script to create an Android Trusted Web Activity shell project.

## Command
From repository root:

```bash
npm run android:twa:init
```

This runs `scripts/bootstrap_twa_project.sh` and invokes Bubblewrap to initialize a project in `android/twa`.

## Optional environment variables
- `APP_ID` (default: `com.wlpapp.twa`)
- `APP_NAME` (default: `WLPApp`)
- `HOST_URL` (default: `https://example.com`)
- `LAUNCHER_NAME` (default: `wlpapp-android`)
- `OUTPUT_DIR` (default: `android/twa`)

Example:

```bash
APP_ID=com.example.wlpapp \
APP_NAME=WLPApp \
HOST_URL=https://wlpapp.example.com \
OUTPUT_DIR=android/wlpapp-twa \
npm run android:twa:init
```

## Notes
- Requires Java + Android SDK tooling installed on your machine.
- The script refuses to overwrite a non-empty output directory.
- After initialization, use Bubblewrap build/sign commands and follow `docs/mobile/play-store-submission-runbook.md`.
