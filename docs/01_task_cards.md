# Workshop Task Cards

Use these task cards during the workshop. Give participants one card at a time.

## Rules for all exercises

1. Use AI, but do not blindly paste code.
2. Every AI-generated change must be reviewed by a human.
3. Keep prompts in a scratch file or notes.
4. Run tests frequently.
5. When stuck, ask AI for hypotheses, not final answers.

Suggested first prompt:

```text
You are helping me work on an unfamiliar FastAPI codebase.
First, inspect the files I give you and summarize:
1. the main responsibilities,
2. likely bugs or design smells,
3. what tests I should run before changing anything.
Do not rewrite code yet.
```

---

# Exercise 1 — Validation: AI is weak without context

Run:

```bash
pytest tests/test_01_validation.py
```

## Baseline

Make these pass:

- empty orders are rejected
- unknown SKUs are rejected
- negative quantities are rejected

## Extension

- reject string quantities like `"2"`
- reject boolean quantities like `true`
- improve error messages
- keep the valid-order test passing

## Expert

Ask AI for two possible validation designs:

1. Pydantic-first validation
2. service-layer validation

Choose one and write a short justification. Seniors should critique AI's recommendation.
Then make sure mixed valid and invalid items fail atomically without creating a partial order.

---

# Exercise 2 — Pricing: from patching to business-rule reasoning

Run:

```bash
pytest tests/test_02_pricing.py
```

## Baseline

Use AI to explain the current pricing code. Do not change anything until you can explain it.

## Extension

Fix coupon behavior:

- discount applies to subtotal only
- discount reduces taxable amount
- expired coupons are rejected
- minimum subtotal is enforced

## Expert

Refactor pricing into smaller functions without hiding business rules. Ask AI to propose edge cases, then write at least three additional tests.
At least one test should protect a boundary case, such as a threshold, invalid type, or minimum subtotal.

---

# Exercise 3 — Security review with AI

Run:

```bash
pytest tests/test_03_security.py
```

## Baseline

Fix malformed Bearer header handling.

## Extension

Fix authorization:

- customers cannot read other customers' orders
- non-admins cannot access reports

## Expert

Fix refund authorization and refund amount validation, including zero and negative amounts. Ask AI to do a mini threat model of this API, then reject at least one over-engineered suggestion.

---

# Exercise 4 — Refactor legacy code safely

Run:

```bash
pytest tests/test_04_refactor_safety.py
```

## Baseline

Ask AI to identify smells in `app/pricing.py` and `app/reports.py`. Pick only one small refactor.

## Extension

Extract helpers while keeping behavior covered by tests.

## Expert

Design a cleaner boundary between:

- request validation
- domain rules
- pricing calculation
- persistence
- reporting

Do not implement all of it. Write the design and one incremental step.

---

# Exercise 5 — Reports: AI-assisted requirements repair

Run:

```bash
pytest tests/test_05_reports.py
```

## Baseline

Make the admin report endpoint work.

## Extension

Report merchandise revenue only, not shipping.

## Expert

Refunded orders should not count as revenue. Make report ordering deterministic and verify multiple customers are grouped correctly.

Then discuss partial refunds:

- Should the report subtract the refunded amount?
- Should partially refunded orders appear with adjusted revenue?
- What audit data would you need before making that rule permanent?

---

# Final team debrief

Each team presents:

1. best prompt they wrote
2. worst AI suggestion they received
3. one test that saved them
4. one place they would use AI differently at work tomorrow
