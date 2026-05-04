#!/usr/bin/env bash
set -euo pipefail

OWNER="${GITHUB_OWNER:-kalinbas}"
REPO="${1:-ai-code-workshop-buggy-api}"
VISIBILITY="${2:---public}"

if [[ "$VISIBILITY" != "--private" && "$VISIBILITY" != "--public" ]]; then
  echo "Usage: ./scripts/publish_to_github.sh [repo-name] [--public|--private]" >&2
  exit 2
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git is required but was not found." >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required. Install it, then run: gh auth login" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "You are not authenticated with GitHub CLI. Run: gh auth login" >&2
  exit 1
fi

if [[ ! -d .git ]]; then
  git init -b main 2>/dev/null || { git init; git branch -M main; }
fi

git add .
if ! git diff --cached --quiet; then
  git commit -m "Initial public AI code workshop repo"
else
  echo "No changes to commit. Continuing."
fi

# Creates GitHub repo under OWNER and pushes the current local repository.
gh repo create "$OWNER/$REPO" "$VISIBILITY" --source=. --remote=origin --push

echo "Published: https://github.com/$OWNER/$REPO"
