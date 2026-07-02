# Quality

Quality rules are only useful when agents can verify them.

## Baseline Gates

Every pull request should run:

```sh
scripts/agent/check-agent-instructions
scripts/agent/check-docs
scripts/agent/check-architecture
```

Add project-native checks as soon as a real stack exists:

- lint
- typecheck
- unit tests
- integration tests
- security scan
- task-specific evaluator

## Testing Policy

- Add or update tests for changed behavior.
- Prefer focused tests near the changed behavior before running full suites.
- Broaden verification when shared behavior, public interfaces, migrations, or
  user-facing flows change.
- Do not delete or weaken tests just to make a change pass.

## Agent Evaluation

For non-trivial work, use an evaluator that did not implement the change. The
evaluator should inspect the diff, run checks, and report only issues that
affect correctness, security, performance, compatibility, or requirements.

## Security and Performance

Security and Performance checks are part of quality, not optional review
categories. Use `docs/SECURITY.md` and `docs/PERFORMANCE.md` when a change
touches auth, data access, logging, dependencies, network calls, hot paths,
database queries, UI bundles, background jobs, or model/tool calls.

## Documentation Policy

Docs must change when behavior, setup, architecture, operations, security, or
performance assumptions change. Avoid copying implementation details that can be
found by reading code.
