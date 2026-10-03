# Operations

Document how the system is run, released, observed, and recovered.

## Local Development

Requires Node.js 20 or newer.
Use Node 22 or 24 LTS for maintained environments; Node 20 remains a legacy
compatibility target. Generated downstream CI uses Node 24.

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
- Run the CI/release gates once on the final release tree. Merge to `main` and
  reuse that evidence when its tree is unchanged; rerun affected checks if it
  changes. Push `main`, then tag the same commit with the semantic version.
- Roll back by reverting the release commit or pinning a known-good Git tag.
- npm registry and marketplace publication require a separate release decision.

## Observability

`doctor --json` provides machine-readable diagnostics for invalid, outdated,
missing, modified, and pending state. CLI failures exit nonzero without printing
file contents. Proposals remain under `.agent-harness/proposals/<version>/`.

For a write-lock error, wait for the running Harness command. If a process was
hard-killed, inspect `.agent-harness/write.lock` and confirm the recorded PID is
no longer running before removing that stale lock. Never remove an active lock.

After changing Codex hooks, review and trust the new definition using `/hooks`.
The generated Stop adapter requests one repair attempt; persistent failures are
reported to the user and must still pass normal CI gates.
Missing adapter files or invalid/oversized event input produce a non-blocking
warning. Run the instruction check and doctor manually to diagnose these errors;
the normal checks still reject missing adapter files.

## Maintenance 0.1.2 — Unreleased

- Preserve LF/CRLF when adding Claude skill invocation metadata.
- Make source and packed-runtime assertions line-ending aware, retaining exact
  canonical-content comparisons and testing both formats on every platform.
- Fix Windows CI failures caused by LF-only assertions and mixed line endings.

## Maintenance 0.1.1 — 2026-10-03

- Preserve custom hook policies and private POSIX file permissions.
- Reject stale plans and concurrent writes; retain recoverable proposals.
- Validate schema-1 manifest records and selected skill requirements.
- Add portable JSON Stop hooks, bounded continuation, and subdirectory support.
- Reject brain symlinks consistently and bound project metadata reads.
- Add Node 24 CI coverage, legacy upgrade fixtures, and packed runtime tests.
- Reuse canonical template/skill sources and shorten adoption documentation;
  installed target paths and ownership contracts remain unchanged.
- Bound routine agent verification: small edits use diff inspection and at most
  one fast focused check, with no default service/browser/build/reviewer chain.

Schema version 1 and the Node 20 minimum remain compatible. Previously malformed
manifest records now fail explicitly; repair their fields against the committed
manifest rather than bypassing validation. Customized legacy hooks may coexist
with the new default adapter and require deliberate configuration review.
Existing installations own their seed `AGENTS.md` and `docs/QUALITY.md`; update
their local verification policy manually from the current templates. Framework
updates preserve those files rather than silently replacing project instructions.

## Incident Notes

After incidents or production regressions, record durable lessons here or in
`docs/agent/decisions/`, then promote repeated checks into scripts, hooks, or CI.
