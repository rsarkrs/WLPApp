#!/usr/bin/env bash
set -euo pipefail

if ! command -v git >/dev/null 2>&1; then
  echo "git is required but not installed" >&2
  exit 1
fi

REPO_URL="${1:-https://github.com/rsarkrs/WLPApp.git}"

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

echo "Configured origin -> $(git remote get-url origin)"

TOKEN="${GITHUB_TOKEN:-${GH_TOKEN:-}}"
if [[ -z "$TOKEN" ]]; then
  cat <<MSG
No GITHUB_TOKEN/GH_TOKEN found.
Set one of these env vars in your runtime secrets before creating PRs.
MSG
  exit 0
fi

if command -v gh >/dev/null 2>&1; then
  gh auth login --hostname github.com --git-protocol https --with-token <<< "$TOKEN" >/dev/null
  gh auth status
else
  echo "gh CLI not found. Falling back to GitHub API auth checks via curl."
  if ! command -v curl >/dev/null 2>&1; then
    echo "curl is required for API fallback check" >&2
    exit 1
  fi
  curl -sS -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" https://api.github.com/user | sed -n '1,12p'
fi
