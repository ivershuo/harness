# Architecture

Document the system shape that agents and humans must preserve.

## Purpose

The Node.js CLI packages templates, discovers project capabilities, plans safe
filesystem changes, records ownership, and validates installed state. It does
not install Codex or Claude Code and does not fetch templates at runtime.

## Boundaries

- `bin/` is the executable adapter and delegates to `src/`.
- `src/` owns argument parsing, project detection, catalog rendering, safe file
  access, reconciliation, and diagnostics.
- `templates/` plus selected repository workflows and skills form the packaged
  template catalog.
- `scripts/agent/check.mjs` is a standalone generated quality gate and must not
  depend on CLI internals or network access.
- Template code may use shared CLI utilities; generated target files must not
  import from the package cache.

## Public Interfaces

- CLI commands: `agent-harness init`, `doctor`, and `update`.
- Manifest: `.agent-harness/manifest.json`, currently schema version 1.
- Template catalog: `templates/catalog.json`, currently schema version 1.
- File ownership values: `seed`, `managed`, and `merged`.
- Text hashes normalize line endings; structured JSON arrays use stable
  identities for Harness-owned commands and hooks.
- CLI options and manifest schema require compatibility notes before breaking
  changes.

## Data Flow

1. Resolve and validate the Git project root.
2. Detect project traits and normalize the requested selection.
3. Render catalog entries and compare content hashes with the manifest.
4. Display a plan before mutation.
5. Atomically write safe changes and proposals, then write the manifest last.
6. Let `doctor` compare recorded ownership with current filesystem state.

Existing seed files remain untouched. When required Harness references are
missing, reconciliation creates a content-preserving proposal and `doctor`
reports the adaptation until the project resolves it.

## Change Rules

- New public interfaces need tests and docs.
- Shared abstractions need at least two real callers or a clear ownership reason.
- Large central files should not grow without a documented staging plan.
- Architecture exceptions must be recorded in `docs/agent/decisions/`.
