# Quality

## Baseline Gate

Every pull request should run:

```sh
{{CHECK_COMMAND}}
```

Add project-native lint, typecheck, unit, integration, contract, browser, and
security checks as soon as the project stack is known.

## Project-Native Gates

{{PROJECT_GATES}}

## Testing Policy

- Add or update tests for changed behavior.
- Run focused tests first, then broaden for shared or public behavior.
- Do not delete or weaken tests just to make a change pass.

## Agent Evaluation

Use an evaluator that did not implement non-trivial changes. It should inspect
the diff, run checks, and focus on correctness, security, performance,
compatibility, and requirements.

Security and Performance requirements are part of the baseline quality gate;
use the dedicated project documents whenever a change affects them.

## Documentation Policy

Update docs when behavior, setup, architecture, operations, security, or
performance assumptions change.
