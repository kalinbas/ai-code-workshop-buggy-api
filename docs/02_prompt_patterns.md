# Prompt Patterns for the Workshop

These are intentionally practical. Participants should adapt them rather than copy blindly.

## 1. Codebase orientation

```text
I am new to this codebase. Based on the following files, explain the responsibilities and data flow.
Do not suggest changes yet. Identify the minimum tests I should run before editing.
```

## 2. Failing test triage

```text
Here is a failing pytest output and the relevant code.
Give me 3 plausible root causes, ranked by likelihood.
For each, tell me how to verify it before changing code.
```

## 3. Safer code generation

```text
Make the smallest change that satisfies this test.
Constraints:
- do not change public endpoint paths
- keep existing passing tests green
- avoid broad rewrites
- explain why the change is minimal
```

## 4. Refactor without behavior change

```text
I want to refactor this function without changing behavior.
First propose characterization tests.
Then suggest a sequence of small refactoring steps.
Do not rewrite the whole file at once.
```

## 5. Senior-level critique

```text
Propose two designs for solving this problem.
For each, list trade-offs, failure modes, and why it might be over-engineered for this repo.
Then recommend the smallest production-grade step.
```

## 6. Security review

```text
Act as a security reviewer for this API.
Find authorization, input validation, and data-leakage risks.
Separate confirmed issues from guesses.
For each confirmed issue, propose a test first.
```

## 7. AI output review

```text
Review the following AI-generated patch.
Look for:
- behavior changes
- missing tests
- over-broad edits
- security regressions
- style inconsistencies
Return a concise review comment as if this were a pull request.
```

## 8. Requirements clarification

```text
The tests imply a behavior, but the product rule is ambiguous.
List the possible interpretations, the user impact of each, and the smallest
test I can write to make my chosen interpretation explicit.
Do not implement until the rule is written down.
```

## 9. Challenge mode

```text
I already have the baseline tests passing.
Suggest 5 additional edge cases for this feature.
Separate must-have correctness tests from interesting-but-probably-too-much
tests for this workshop repo.
```
