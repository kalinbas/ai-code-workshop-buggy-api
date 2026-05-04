# Workshop Task Cards

Use these task cards one at a time. This shorter version is designed for a
half-day workshop.

## Rules for all exercises

1. Use AI, but do not blindly paste code.
2. Every AI-generated change must be reviewed by a human.
3. Run tests frequently.
4. When stuck, ask AI for hypotheses, not final answers.

Suggested first prompt:

```text
You are helping me work on an unfamiliar Node.js API.
First, inspect the files I give you and summarize:
1. the main responsibilities,
2. likely risks or design smells,
3. what tests I should run before changing anything.
Do not rewrite code yet.
```

---

# Exercise 1 — Validation

Run:

```bash
npm run test:validation
```

## Goal

Make invalid orders fail instead of being silently accepted.

## Tasks

- empty orders are rejected
- unknown SKUs are rejected
- negative quantities are rejected
- string quantities like `"2"` are rejected
- valid orders still work

## Discussion

- Should validation live at the HTTP boundary, in pricing, or both?
- How did your prompt change after seeing the first AI answer?

---

# Exercise 2 — Pricing

Run:

```bash
npm run test:pricing
```

## Goal

Fix the most visible pricing rules without rewriting the whole module.

## Tasks

- coupon discounts apply to subtotal only
- coupon discounts reduce the taxable amount
- expired coupons are rejected
- premium customers get free shipping at subtotal `>= 100` before discount

## Discussion

- Which rules were hidden inside calculation code?
- Did AI try to rewrite too much?

---

# Exercise 3 — Security

Run:

```bash
npm run test:security
```

## Goal

Fix the most important authentication and authorization gaps.

## Tasks

- malformed Bearer headers are rejected
- customers cannot read another customer's order
- non-admins cannot access revenue reports
- non-admins cannot refund orders

## Discussion

- What is the difference between authentication and authorization?
- Which AI suggestion would you reject before production?

---

# Final Debrief

Each team shares:

1. best prompt they wrote
2. worst AI suggestion they received
3. one test that saved them
4. one thing they would use at work tomorrow
