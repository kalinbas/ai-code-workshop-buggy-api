# AI Patch Review Lab

Use this exercise whenever a team has a patch that makes a test pass.

## Review Checklist

- Does the patch change only the behavior under discussion?
- Did it change tests instead of implementation?
- Did it introduce a broad rewrite where a small step would work?
- Are errors returned as `400` or `422` instead of becoming `500` responses?
- Did it preserve endpoint paths and token names?
- Is the behavior covered by a focused test?
- Can the driver explain the code without reading the AI response?

## Review Prompt

```text
Review this patch as if it were a pull request.
Focus on correctness, missing tests, accidental behavior changes, and whether
the implementation is appropriately small for this workshop repo.
Return findings first, then a brief summary.
```

## Human Decision

Before merging your own patch, write one sentence for each:

```text
I trust this change because:
I am still uncertain about:
The test that protects this behavior is:
```
