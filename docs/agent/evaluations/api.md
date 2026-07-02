# Evaluation: API

Use for HTTP, RPC, events, CLI, config, or schema changes.

## Checks

- Public shape is documented and backward-compatible unless migration is explicit.
- Inputs validate at the boundary.
- Errors use the documented shape.
- Auth and authorization behavior is tested.
- Contract or integration tests cover changed behavior.
