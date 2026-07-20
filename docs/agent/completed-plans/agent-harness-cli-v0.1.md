# Agent Harness CLI v0.1

## Goal

Let public users initialize, validate, and safely update this harness in an
existing Git repository without manually copying files.

## Scope

- Add a dependency-free Node.js 20+ CLI with `init`, `doctor`, and `update`.
- Package base, brain, UI, API, Codex, Claude, and GitHub CI template modules.
- Track installed files and ownership in `.agent-harness/manifest.json`.
- Preserve user-owned files and create proposals for managed-file conflicts.
- Replace shell-only checks with a cross-platform Node entrypoint.
- Document main-branch installation, upgrades, ownership, and release behavior.

## Non-Goals

- Publishing the package to the npm registry.
- Shipping Codex or Claude Code marketplace plugins.
- Automatically removing installed modules or project-owned documents.
- Modifying an existing CI workflow.

## Approach

- Use native ESM and Node standard-library APIs only.
- Keep templates under `templates/` with catalog-declared modules and ownership.
- Treat seed files as project-owned, managed files as hash-guarded, and shared
  settings as block- or structure-merged.
- Use atomic writes, normalized text hashes, safe proposals, and strict path and
  symlink checks.
- Run generated CI against checked-in scripts without network access.

## Acceptance Criteria

- The GitHub-installed package invokes the CLI without a build step.
- Existing project files, JSON keys, hook matchers, and user hooks are preserved.
- Re-running `init` produces no changes in a clean initialized repository.
- Modified managed files are never overwritten during update.
- `doctor` reports missing, modified, pending, outdated, and invalid state.
- The package contains every runtime and template file needed by the CLI.

## Verification

```sh
npm test
npm run check
npm run verify:package
node bin/agent-harness.mjs --help
```

## Results

- 22 automated tests passed, including existing-project adoption, CRLF, dirty
  worktrees, seed adaptation, JSON hook migration, symlinks, and path traversal.
- Package verification passed with 73 runtime/template files.
- A packed tarball completed `init`, generated checks, and `doctor` in a fresh
  temporary Git repository.
- Independent review findings were reproduced, fixed, regression-tested, and
  re-reviewed through final targeted passes.
- The repository CI matrix covers Node 20/22 on Linux, macOS, and Windows.

## Risks and Rollback

- Partial writes remain diagnosable because the manifest is written last.
- Symlink TOCTOU cannot be eliminated completely without platform-specific file
  descriptor APIs; the CLI rejects observed symlinks before reads and writes.
- Roll back through Git or pin the previous semantic version tag.
