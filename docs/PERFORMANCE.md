# Performance

Performance requirements must be explicit because agents otherwise optimize for
visible correctness only.

## Budgets

Define project-specific budgets here:

- Page load or interaction latency:
- API p95 latency:
- Background job duration:
- Database query count:
- Bundle size:
- Model/tool call count:

## Review Checklist

- Hot paths do not add avoidable network, database, filesystem, or model calls.
- Loops over unbounded data are paginated, streamed, or capped.
- Caches have clear invalidation and ownership.
- UI changes avoid layout shift and excessive bundle growth.
- Observability can identify regressions after deployment.

## Verification

Use the smallest meaningful performance check for a change: benchmark, trace,
query plan, bundle analyzer, load test, or production metric comparison.
