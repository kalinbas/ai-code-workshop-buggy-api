# 1-Day Practical Workshop Plan

This public plan assumes 10 programmers with mixed experience. Use 5 pairs, or 3 groups of three plus one facilitator-paired participant.

## Pre-work

Send participants the setup instructions before the workshop. Ask them to install dependencies, run `pytest --collect-only`, and confirm that the full test suite starts with intentional failures.

## 09:00–09:20 — Kickoff

No slides unless absolutely necessary.

Do:

1. explain that the repo is intentionally broken
2. show one bad prompt and one improved prompt
3. explain the three lanes: baseline, extension, expert

## 09:20–10:20 — Exercise 1: validation

Run `pytest tests/test_01_validation.py`.

Facilitator focus:

- juniors: prompt quality and understanding code before editing
- seniors: where validation should live

## 10:20–10:35 — Break

## 10:35–12:00 — Exercise 2: pricing

Run `pytest tests/test_02_pricing.py`.

Facilitator focus:

- force teams to write/confirm business rules before patching
- ask seniors to critique AI's proposed design

## 12:00–13:00 — Lunch

## 13:00–14:15 — Exercise 3: security

Run `pytest tests/test_03_security.py`.

Facilitator focus:

- test-first security fixes
- distinguish authentication from authorization

## 14:15–14:30 — Break

## 14:30–15:30 — Exercise 4: refactor safely

Run `pytest tests/test_04_refactor_safety.py`.

Facilitator focus:

- small refactors only
- compare AI-generated refactor plans

## 15:30–16:20 — Exercise 5: reports

Run `pytest tests/test_05_reports.py`.

Facilitator focus:

- requirements clarification
- partial refund discussion for expert teams

## 16:20–17:00 — Debrief

Each team presents:

1. best prompt
2. worst AI suggestion
3. one useful test
4. what they would use tomorrow at work

End by producing a team-level checklist for AI-assisted software engineering.
