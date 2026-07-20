# Operations

Document how the system is run, released, observed, and recovered.

## Local Development

Requires Node.js 20 or newer.

```sh
npm test
npm run check
npm run verify:package
node bin/agent-harness.mjs --help
```

## Release

- `main` is the only stable default installation source; `beta` is for
  development and is not shown in public quick-start commands.
- Finish and verify releases on `beta`, fetch remote `main`, and stop if the
  branches diverged unexpectedly.
- Merge to `main`, rerun all tests and package inspection, push `main`, then tag
  the same commit with the semantic version.
- Roll back by reverting the release commit or pinning a known-good Git tag.
- npm registry and marketplace publication require a separate release decision.

## Observability

List logs, metrics, traces, dashboards, alerts, and runbooks that agents should
consult when diagnosing issues.

## Incident Notes

After incidents or production regressions, record durable lessons here or in
`docs/agent/decisions/`, then promote repeated checks into scripts, hooks, or CI.
