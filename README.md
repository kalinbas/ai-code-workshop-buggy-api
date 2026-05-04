# AI Code Workshop: Broken Orders API

A deliberately flawed FastAPI codebase for a practical workshop on using AI to
understand, test, analyze, and refactor code in small safe steps.

The project is intentionally not production-ready. Your job is to use an AI
assistant as a collaborator while you decide what to trust, what to test, and
what to reject.

## Who this is for

This workshop works best for mixed-experience teams. The same repo supports:

- baseline tasks for everyone
- extension tasks for people moving quickly
- expert tasks for senior engineers and deeper design discussion

Work in pairs or groups of three. Rotate the keyboard driver every 20-30
minutes.

## What you will practice

- orienting yourself in unfamiliar code
- turning vague prompts into useful engineering instructions
- reading failing tests before editing code
- separating confirmed bugs from guesses
- asking AI for options, then making the engineering decision yourself
- writing tests before changing behavior
- reviewing AI-generated code critically
- refactoring without changing behavior accidentally

## Prerequisites

- Python 3.10 or newer
- Git
- A code editor
- An AI coding assistant or chat-based model

This repo was locally verified with Python 3.13.

Check your Python version first:

```bash
python3 --version
```

If that prints a version below 3.10, use a newer executable such as
`python3.13`, `python3.12`, `python3.11`, or `python3.10` in the setup commands.

## Setup

```bash
PYTHON=python3.13  # change this if your newer Python uses another name
$PYTHON -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
python -m pip install -e ".[dev]"
pytest --collect-only
pytest
```

The full test suite should collect successfully and then fail. That is the
starting point for the workshop.

Run the API:

```bash
uvicorn app.main:app --reload
```

Open the local API docs:

```text
http://127.0.0.1:8000/docs
```

## Useful Commands

```bash
make check-setup      # confirm Python version
make test             # all tests
make test-baseline    # baseline lane tests
make test-extension   # extension lane tests
make test-expert      # expert lane tests
make test-refactor    # refactor guardrails
make run              # start the API
```

If your newer Python is not named `python3`, run commands as
`make PYTHON=python3.13 check-setup`.

You can also run one exercise at a time:

```bash
pytest tests/test_01_validation.py
pytest tests/test_02_pricing.py
pytest tests/test_03_security.py
pytest tests/test_04_refactor_safety.py
pytest tests/test_05_reports.py
```

## How to Work With AI

Use AI, but do not treat it as the authority.

1. Ask it to inspect and summarize before asking for code.
2. Give it the failing test, the relevant files, and the constraints.
3. Ask for hypotheses and verification steps before fixes.
4. Make the smallest change that explains the test result.
5. Run tests after each change.
6. Review AI-generated patches as if they came from a teammate.
7. Be ready to reject suggestions you cannot explain.

Start with this prompt:

```text
You are helping me work on an unfamiliar FastAPI codebase.
First, inspect the files I provide and summarize:
1. the main responsibilities,
2. likely risks or design smells,
3. the minimum tests I should run before changing anything.
Do not rewrite code yet.
```

Keep a prompt journal as you go. A template is available in
`docs/prompt_journal_template.md`.

## Exercise Map

| Exercise | Focus | Start Command |
| --- | --- | --- |
| 1 | Request validation and atomic failures | `pytest tests/test_01_validation.py` |
| 2 | Pricing rules and business logic | `pytest tests/test_02_pricing.py` |
| 3 | Authentication, authorization, and refunds | `pytest tests/test_03_security.py` |
| 4 | Refactoring with guardrails | `pytest tests/test_04_refactor_safety.py` |
| 5 | Reports and requirements repair | `pytest tests/test_05_reports.py` |

Each exercise has baseline, extension, and expert paths. See
`docs/01_task_cards.md` for the full workshop flow.

## Local Test Tokens

Use these `Authorization` headers while testing protected endpoints:

```text
Authorization: Bearer user-token-1
Authorization: Bearer premium-token-1
Authorization: Bearer admin-token
```

## Business Rules to Discover and Enforce

### Orders

- An order must contain at least one item.
- `sku` must exist in the catalog.
- `quantity` must be an integer between 1 and 20.
- Invalid requests should not create partial orders.

### Pricing

- Subtotal is the sum of item price times quantity.
- Coupon discounts apply to subtotal only.
- Coupon discounts reduce the taxable amount.
- Expired coupons are invalid.
- Coupons with a minimum subtotal must enforce it.
- Premium customers receive free shipping when subtotal is at least 100 before
  discount.
- Gift cards are not taxable and are not shippable.

### Security

- Auth headers must use the exact `Bearer <token>` format.
- Only the owner or an admin can read an order.
- Only admins can refund orders.
- Only admins can access revenue reports.

### Reporting

- Revenue reports should count merchandise subtotal after discounts.
- Shipping is not revenue for this report.
- Refunded orders should not count as revenue.
- Partial refunds are intentionally left as a requirements discussion for the
  expert lane.

## Workshop Materials

- `docs/01_task_cards.md`: participant-facing exercise cards
- `docs/02_prompt_patterns.md`: reusable prompt patterns
- `docs/prompt_journal_template.md`: worksheet for tracking prompts and results
- `docs/ai_patch_review_lab.md`: practice reviewing AI-generated patches
- `docs/workshop_rubric.md`: scoring and debrief guide
