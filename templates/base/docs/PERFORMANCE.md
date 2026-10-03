# Performance

## Budgets

Record only metrics relevant to this project. For each, name the workload,
limit, measurement command, and reference environment. Examples include CLI
runtime/file limits, UI load latency/bundle size, API p95/query count, worker
duration/queue depth, and model context/tool-call limits.

Mark unknown budgets as pending with an owner and measurement task; do not
leave unrelated empty placeholders or treat guesses as measured baselines.

## Review Checklist

- Hot paths avoid unnecessary network, database, filesystem, and model calls.
- Unbounded data is paginated, streamed, or capped.
- Caches have explicit invalidation and ownership.
- UI changes avoid layout shift and excessive bundle growth.
- Observability can identify regressions after deployment.

## Verification

List the repeatable measurements and where their baselines are recorded. Use
comparable inputs and environments; keep noisy timing thresholds out of CI
unless the runner and workload are controlled.
