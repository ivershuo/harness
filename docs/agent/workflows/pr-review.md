# Workflow: Pull Request Review

Use this for human or agent reviews.

## Review Order

1. Correctness and requirement fit.
2. Security and privacy.
3. Data loss, migrations, and compatibility.
4. Performance and scalability.
5. Test coverage and observability.
6. Maintainability and docs.

## Rules

- Findings first, ordered by severity.
- Use file and line references when available.
- Avoid broad style feedback unless it blocks maintainability or violates a
  documented rule.
- If there are no issues, say so and list residual test gaps.
