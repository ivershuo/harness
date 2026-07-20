# Performance

## Budgets

- Page load or interaction latency:
- API p95 latency:
- Background job duration:
- Database query count:
- Bundle size:
- Model or tool call count:

## Review Checklist

- Hot paths avoid unnecessary network, database, filesystem, and model calls.
- Unbounded data is paginated, streamed, or capped.
- Caches have explicit invalidation and ownership.
- UI changes avoid layout shift and excessive bundle growth.
- Observability can identify regressions after deployment.
