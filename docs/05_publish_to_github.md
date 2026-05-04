# Publish the Public Workshop Repo

This repo is intended to be public and participant-facing. Do not publish local
facilitator notes or private answer keys.

## Pre-publish checks

```bash
git status --short
rg "D[o] Not Give|Expected pricin[g]|B[U]G" .
npm test
npm run test:baseline
npm run test:extension
npm run test:expert
```

The tests should collect successfully. Some tests should fail because the repo
is intentionally broken for the workshop.

## Publish

```bash
git init -b main
git add .
git commit -m "Initial public AI code workshop repo"
gh repo create kalinbas/ai-code-workshop-buggy-api --public --source=. --remote=origin --push
```

If the repository already exists, add it as the remote and push:

```bash
git remote add origin https://github.com/kalinbas/ai-code-workshop-buggy-api.git
git push -u origin main
```
