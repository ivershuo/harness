# Quality

## Local Verification

Choose evidence by changed behavior and concrete risk, not line/file count.

| Change | Default local verification |
| --- | --- |
| Docs, comments, copy, simple styling, local constant/config edits | Inspect the diff; zero or one fast targeted check. No new tests, service, browser, build, plan, or reviewer by default. |
| Local logic or bounded bug fix | One existing relevant case/suite; add a regression only for meaningfully uncovered behavior. |
| Shared core, public contract, auth/security, data loss, migration | Identify the risk and select targeted regression/contract checks; broader work requires a specific reason. |

- Verify affected acceptance criteria, not just a command's exit code. Functional
  changes need evidence of the changed behavior; unrelated passing lint is insufficient.
- Stop verification once those criteria have sufficient evidence. Rerun when
  tested code changes, a check fails, or a new concrete concern appears; reuse
  evidence for unchanged code.
- Keep routine local verification within two minutes total. Stop/cancel
  unexpectedly slow checks safely and report remaining uncertainty. Explicitly
  requested or justified high-risk checks may exceed this budget.
- Do not start services, open browsers, run full builds/suites, install test
  tools, repair unrelated environments, or reproduce CI matrices by default.
  State a specific changed behavior that needs them before escalation.
- Browser checks are justified when affected acceptance criteria need runtime
  or visual evidence, or the user requests them. Use a representative preview
  or screenshot for a visual redesign/layout fix. Copy or colors alone do not
  automatically require them.
- Do not write tests mirroring trivial edits or repeat umbrella `test` together
  with unit/integration commands it already includes.
- Diagnose the failing path instead of automatically widening verification.
- Summarize commands/results and useful failures; never claim unperformed checks.

## Shared CI Gate

Every pull request should run:

```sh
{{CHECK_COMMAND}}
```

This is a shared gate, not a requirement to run every available check after each
edit. Add applicable project-native checks to CI; the list below is a menu for
local tasks, not a checklist. Avoid overlapping commands.

## Project-Native Gates

{{PROJECT_GATES}}

## Testing Policy

- Reuse existing coverage; add tests for substantive new behavior, uncovered
  regressions, and safety/compatibility contracts.
- Broaden only for a specific affected dependency or uncovered risk.
- Do not delete or weaken tests just to make a change pass.

## Agent Evaluation

Use one independent final review for substantial functional or high-risk
changes. Routine edits need no reviewer. Reviewers inspect the diff and existing
passing evidence; rerun only suspect or unverified paths. Plan review is reserved
for unresolved architecture/contract tradeoffs, not every multi-file edit.

Security and Performance requirements are part of the baseline quality gate;
use the dedicated project documents whenever a change affects them.

## Documentation Policy

Update docs when behavior, setup, architecture, operations, security, or
performance assumptions change.

## Guidance Basis

Reviewed against current official guidance on 2026-10-03:
[Claude Code best practices](https://code.claude.com/docs/en/best-practices),
[Codex best practices](https://learn.chatgpt.com/guides/best-practices), and
[OpenAI's instruction-maintenance guidance](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra).
Keep context task-specific, instructions concise, and verification relevant
across supported agents. The two-minute budget and zero-or-one-check default
are project preferences, not vendor requirements or a substitute for evidence.
