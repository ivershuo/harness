# Harness Safety and Adapter Maintenance

## Goal

Fix the confirmed 2026-10-03 review findings and make safe upgrades and generated
quality gates reliable without adding production dependencies.

## Scope

- Preserve custom hooks and file permissions during reconciliation.
- Record exact planned file state, verify before writing, and serialize Harness
  writers with a repository lock.
- Validate manifest selection, ownership, records, and pending proposals.
- Deliver a standalone Stop hook adapter with root discovery, JSON decisions,
  bounded continuation, and protocol tests.
- Check required skills and reject unsafe brain paths consistently.
- Add cross-version and packed-package smoke coverage; update CI and docs.

## Non-Goals

- Publishing, merging, tagging, or deploying a release.
- Adding dependencies or raising the Node 20 minimum in this maintenance change.
- Redesigning the CLI or changing the three ownership modes.

## Approach

- Keep existing public CLI options and schema version 1 compatible.
- Bump the unreleased maintenance version to 0.1.1 so template and proposal
  metadata distinguish these fixes from v0.1.0; no release/tag is published.
- Extract merging and manifest responsibilities from the central harness module.
- Use a small packaged validation module beside generated checks, shared by the
  CLI and checker; generated scripts must not import CLI internals.
- Recognize only exact known Harness command strings; preserve customized
  command handlers and matcher groups while migrating known legacy hooks.
- Reject stale plans before mutations and recheck individual destinations under
  an exclusive Harness lock. Preserve POSIX permissions with exclusive temporary
  file creation.
- Use a portable Node bootstrap to locate the Git root and load the adapter.
- Add Node 24 to the CI matrix and use Node 24 in generated CI; retain Node 20
  compatibility as a documented legacy option.

## Acceptance Criteria

- All seven reviewed defects have regression tests that fail before their fixes.
- Custom security commands, matcher groups, and timeout settings survive updates.
- Stale plans and concurrent Harness writers cannot silently overwrite files.
- Malformed manifests produce parseable doctor errors and cannot bypass gates.
- Stop hooks work from subdirectories and paths with spaces, emit JSON, and stop
  automatically retrying a persistent failure after one continuation.
- Brain symlinks and missing selected skills fail doctor and generated checks.
- Existing tests, package inspection, and packed runtime smoke tests pass.
- Independent plan review and final correctness/security review are completed.

## Verification

- Focused regression tests before implementation, then nearest suites.
- `npm test`, `npm run check`, `npm run verify:package`.
- Packed tarball init/check/doctor/hook execution in a temporary Git repository.
- Review generated target files and v0.1-to-current ownership reconciliation.

## Risks and Rollback

- POSIX symlink races with non-cooperating processes cannot be fully prevented
  portably; observed symlinks are rejected and stale content is rechecked.
- A hard-killed process can leave the exclusive lock; report a recovery path
  rather than automatically stealing a potentially active lock.
- Customized legacy hooks can coexist with the new default hook; preserve them
  and document migration rather than discard user policy.
- Hook trust remains a user/runtime operation; document it after updates.
- Roll back code via Git; target repositories can inspect proposals and pin a
  previous version. No downstream repositories are modified by this task.

## Results — 2026-10-03

Implemented on `codex/harness-safety-and-adapters`, with maintenance version
`0.1.1` remaining unreleased. All seven confirmed findings now have regressions
that failed against their original implementations and pass after the fixes.

- Exact default-hook migration preserves custom commands, handler options,
  matcher groups, and sibling policies.
- Exact-content plan preconditions, preflight checks, per-destination rechecks,
  and an exclusive repository write lock protect against stale/cooperating
  concurrent writers. Replacement preserves existing POSIX mode and owner/group.
- A packaged shared schema validates manifest selection, ownership, state,
  hashes, versions, and pending proposal records for both CLI and checker.
- Standalone Stop adapters emit JSON, resolve the installed Git root, and bound
  repair continuation. Missing adapters and malformed/oversized input warn
  without repeatedly blocking the agent.
- Selected skills are mandatory. Doctor and checker both reject brain symlinks,
  including non-Markdown entries. Project metadata reads are bounded and reject
  symlinks.
- Merging and manifest validation have focused modules. CI covers Node 20/22/24,
  generated CI uses Node 24, and documentation reflects current checks,
  performance budgets, migration, hook trust, and lock recovery.

Final local verification: macOS, Node `24.12.0`, npm `11.12.1`.

- `npm test`: **43/43 passed**, including legacy v0.1.0 upgrade fixtures and an
  actual packed-tarball init/check/doctor/Stop-hook smoke test.
- `npm run check`: instructions, docs, architecture, brain, templates passed.
- `npm run verify:package`: 79 files; passed.
- `git diff --check`: passed.
- Independent plan review and final correctness/security evaluation completed;
  evaluator findings were reproduced, fixed, and retested. Final evaluation
  reported no remaining actionable findings and independently passed all six
  hook tests.
- Five fresh local repositories measured median init 71 ms, doctor 45 ms, and
  direct Stop adapter 43 ms. These are local observations, not CI assertions.

No production dependencies were added. No remote CI, native Windows/Linux
execution, or live Codex/Claude hook session was run; the matrix and portable
commands require those platform checks in CI. POSIX ACL preservation and races
with non-cooperating filesystem writers remain outside the portable guarantee,
as documented in SECURITY.md. No commit, tag, publication, or deployment was
performed by this task.
