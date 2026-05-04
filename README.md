# AI Code Workshop: Broken Orders API

This is a deliberately broken Node.js API for a short workshop on using AI to
understand, test, debug, and refactor code.

The goal is to finish the core exercises in a half-day session. Work in small
steps: run one test file, ask AI for help, review the answer, change code, and
run the test again.

## What You Need

- Node.js 20 or newer
- Git
- A code editor
- An AI assistant

This repo was tested with Node.js 24.

## Step 1: Get the Code

```bash
git clone https://github.com/kalinbas/ai-code-workshop-buggy-api.git
cd ai-code-workshop-buggy-api
```

## Step 2: Check Node

```bash
node --version
npm run check-setup
```

No virtual environment is needed. This project uses only built-in Node.js
modules, so there are no packages to install.

## Step 3: Check the Starting Point

```bash
npm test
```

Several tests should fail. That is expected. The failures are the workshop.

## Step 4: Do the Three Exercises

Run one exercise at a time:

```bash
npm run test:validation
npm run test:pricing
npm run test:security
```

Use `docs/01_task_cards.md` for the instructions for each exercise.

## Step 5: Use AI in Small Steps

Start with this prompt:

```text
You are helping me work on an unfamiliar Node.js API.
First, inspect the files I provide and summarize:
1. the main responsibilities,
2. likely risks or design smells,
3. the minimum tests I should run before changing anything.
Do not rewrite code yet.
```

For each exercise:

1. Run the test file.
2. Give AI the failing test and relevant code.
3. Ask for possible causes before asking for code.
4. Make one small change.
5. Run the test again.
6. Review the AI suggestion before trusting it.

More prompt examples are in `docs/02_prompt_patterns.md`.

## Optional: Run the API

```bash
npm start
```

Open:

```text
http://127.0.0.1:8000/docs
```

Use these local test tokens:

```text
Authorization: Bearer user-token-1
Authorization: Bearer premium-token-1
Authorization: Bearer admin-token
```

## Useful Commands

```bash
npm run check-setup
npm test
npm run test:baseline
npm run test:extension
npm run test:expert
npm run test:validation
npm run test:pricing
npm run test:security
npm run smoke
npm run demo
```

The same commands are also available through `make` if you prefer it.

## Extra Workshop Files

- `docs/01_task_cards.md`: exercise instructions
- `docs/02_prompt_patterns.md`: prompts to try
- `docs/prompt_journal_template.md`: worksheet for tracking prompts
- `docs/ai_patch_review_lab.md`: checklist for reviewing AI output
- `docs/workshop_rubric.md`: debrief rubric
- `examples/refactor-prompt-demo.js`: small presentation demo
