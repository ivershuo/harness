# Architecture

## Purpose

The Node.js CLI packages templates, discovers project capabilities, plans safe
filesystem changes, records ownership, and validates installed state. It does
not install Codex or Claude Code and does not fetch templates at runtime.

## Boundaries

- `bin/` is the executable adapter and delegates to `src/`.
- `src/` owns argument parsing, project detection, catalog rendering, safe file
  access, reconciliation, and diagnostics.
- JSON/block merging and manifest loading are focused modules under `src/`;
  writer locking is separate from planning and file replacement.
- `templates/` plus selected repository workflows and skills form the packaged
  template catalog.
- Generic brain protocol and Claude notes use their canonical repository files.
  Skill procedures are sourced from `.agents/skills/`; the Claude catalog adapter
  adds manual-invocation metadata without changing the shared body. Native
  repository wrappers remain available for local tool discovery.
  Inserted metadata preserves the source skill's LF or CRLF line endings.
  Canonical skill frontmatter is limited to flat `name` and `description` fields;
  unknown fields, quoted keys, duplicate keys, and multiline YAML are rejected.
- Keep merged templates separate from their target files: using a managed block
  as its own mutable source would nest markers during self-reconciliation.
- `scripts/agent/` is a self-contained generated quality gate and Stop adapter.
  Its shared manifest validator has no filesystem dependencies and is also used
  by the packaged CLI. Generated scripts must not depend on CLI internals or
  network access.
- Template code may use shared CLI utilities; generated target files must not
  import from the package cache.

## Public Interfaces

- CLI commands: `agent-harness init`, `doctor`, and `update`.
- Manifest: `.agent-harness/manifest.json`, currently schema version 1.
- Template catalog: `templates/catalog.json`, currently schema version 1.
- File ownership values: `seed`, `managed`, and `merged`.
- Text hashes normalize line endings; structured JSON arrays use stable
  identities for exact known default hooks and preserve user matcher groups.
- Manifest schema 1 now validates record fields and ownership/state combinations;
  malformed metadata returns structured doctor errors.
- CLI options and manifest schema require compatibility notes before breaking
  changes.

## Data Flow

1. Resolve and validate the Git project root.
2. Detect project traits and normalize the requested selection.
3. Render catalog entries and compare content hashes with the manifest.
4. Display a plan before mutation.
5. Acquire an exclusive repository writer lock and verify exact file snapshots.
6. Recheck each destination before atomic replacement, preserve POSIX file
   permissions and owner/group, and write the manifest last.
7. Let `doctor` compare recorded ownership with current filesystem state.

Existing seed files remain untouched. When required Harness references are
missing, reconciliation creates a content-preserving proposal and `doctor`
reports the adaptation until the project resolves it.

Stop hooks discover the Git root through a portable Node bootstrap and invoke
the installed adapter. The adapter runs only instruction hygiene, emits JSON,
and uses the event's `stop_hook_active` field to bound automatic continuation.

## Change Rules

- New public interfaces need tests and docs.
- Shared abstractions need at least two real callers or a clear ownership reason.
- Large central files should not grow without a documented staging plan.
- Architecture exceptions must be recorded in `docs/agent/decisions/`.
