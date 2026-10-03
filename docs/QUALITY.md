# Quality

Quality rules are only useful when agents can verify them.

## Local Verification

Local verification is proportional to the changed behavior, not the number of
edited lines/files or the list of available tools. Default to the smallest
useful evidence and stop when it passes.

| Change | Default local verification |
| --- | --- |
| Docs, comments, copy, simple styling, local constant/config edits | Inspect the diff; zero or one fast targeted check. No new tests, service, browser, build, plan file, or reviewer by default. |
| Local logic or a bounded bug fix | Run an existing relevant case or focused suite; add a regression only when the behavior is not meaningfully covered. |
| Shared core, public contract, auth/security, data loss, migration, installation/packaging | Identify the concrete risk and choose targeted regression/contract checks. Add upgrade/packed-runtime coverage when those paths change; broader tests require an explicit reason. |

Small edits can still be high risk; evaluate the behavior, not line count.
Choose evidence against the affected acceptance criteria, not just a command's
exit code. A functional change needs evidence of the changed behavior; an
unrelated passing lint check is insufficient.
Browser/service startup is justified when affected acceptance criteria need
runtime or visual evidence, or when the user explicitly requests it. For a
visual redesign or layout fix, use a representative preview/screenshot rather
than treating source inspection as visual proof. Copy, colors, comments, and
static markup do not automatically require screenshots or every UI state.

- Choose a verification command once; do not accumulate unit, integration,
  build, and browser checks without identifying what each additional run proves.
- Routine local checks have a two-minute total budget. If a check is unexpectedly
  slow, stop/cancel it safely and report the remaining uncertainty. Do not start
  servers, install dependencies, fix unrelated environments, or launch another
  tool as an automatic fallback.
- Stop verification once affected acceptance criteria have sufficient evidence.
  Rerun only for changed tested code, a failure,
  or a new concrete concern. Existing passing evidence stays valid for unchanged
  code; do not rerun full suites after documentation-only follow-up edits.
- A failure calls for diagnosis of that failing path, not automatic expansion to
  the entire application. Select one representative affected case first.
- Reuse umbrella commands: if `test` includes unit/integration, do not run all
  three. Keep normal output to command, result, and useful failure details.
- State the specific reason before expensive verification. A slow check needed
  for an identified high-risk change or explicitly requested by the user can
  exceed the routine budget; unperformed checks must never be reported as passed.

## Repository CI Gates

Every pull request should run:

```sh
npm test
npm run check
npm run verify:package
```

These are the repository CI/release gates, not a local checklist after every
edit. Agents do not reproduce the full CI matrix or rerun all three by default.

The test runner enumerates test files explicitly for Node 20 and Windows
compatibility. It covers CLI journeys, file safety, manifest diagnostics, hook
protocols, v0.1.0 upgrade fixtures, and packed tarball execution. The harness
checker is also available directly as `node scripts/agent/check.mjs`.

CI tests Node 20/22/24 on Linux, macOS, and Windows. POSIX-only permission and
symlink tests are skipped on Windows; Windows ACL preservation is not verified
by these tests. Generated downstream CI uses Node 24 and runs the harness gate;
downstream projects remain responsible for native lint, typecheck, tests,
integration, contract, browser, and security checks.

## Testing Policy

- Reuse existing coverage and add tests only for substantive new behavior,
  uncovered regressions, or a changed safety/compatibility contract.
- Do not create tests that repeat a trivial implementation or snapshots for
  cosmetic edits solely to satisfy a testing ritual.
- Broaden only when a specific affected dependency or uncovered risk warrants it.
- Do not delete or weaken tests just to make a change pass.

## Agent Evaluation

Use an independent evaluator for substantial functional or high-risk changes,
not routine edits. Default to one final review; use plan review only for a real
unresolved architecture/contract tradeoff. The reviewer inspects the diff and
existing evidence, rerunning only a suspect or unverified path. Do not spawn
separate test/UI/security/reviewer agents for a small change. Report concrete
issues affecting correctness, security, performance, compatibility, or requirements.

## Security and Performance

Security and Performance checks are part of quality, not optional review
categories. Use `docs/SECURITY.md` and `docs/PERFORMANCE.md` when a change
touches auth, data access, logging, dependencies, network calls, hot paths,
database queries, UI bundles, background jobs, or model/tool calls.

## Documentation Policy

Docs must change when behavior, setup, architecture, operations, security, or
performance assumptions change. Avoid copying implementation details that can be
found by reading code.

## Guidance Basis

Reviewed against current official guidance on 2026-10-03:
[Claude Code best practices](https://code.claude.com/docs/en/best-practices),
[Codex best practices](https://learn.chatgpt.com/guides/best-practices), and
[OpenAI's instruction-maintenance guidance](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra).
Apply their task-scoped context, concise instructions, and relevant verification
principles across supported agents; do not require a particular model.
The two-minute budget and zero-or-one-check default are project preferences,
not vendor requirements or a substitute for evidence of correct behavior.
