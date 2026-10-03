# Evaluation: API

Use for HTTP, RPC, events, CLI, config, or schema changes.

Apply only to changed contracts and capabilities the project actually has.
Mark unrelated items as not applicable; a CLI/config edit alone does not require
server startup, auth tests, or new integration fixtures. Use existing focused
evidence first and follow `docs/QUALITY.md` local limits.

## Checks

- Public shape is documented and backward-compatible unless migration is explicit.
- Inputs validate at the boundary.
- Errors use the documented shape.
- Auth and authorization checks cover affected behavior when those capabilities
  exist and are changed.
- Reuse existing contract/integration coverage; add meaningful tests for an
  uncovered contract or regression, not to repeat a trivial implementation.
