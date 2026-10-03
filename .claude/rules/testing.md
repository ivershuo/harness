# Testing Rules

- Follow docs/QUALITY.md local verification limits. Small edits need diff
  inspection and at most one fast focused check by default. Verify affected
  acceptance criteria; an unrelated passing check is insufficient. Stop
  verification when sufficient evidence exists.
- Reuse existing coverage. Add regressions for uncovered bugs or substantive
  behavior, not tests mirroring copy, styling, constants, or trivial edits.
- Do not start services/browsers, run builds/full suites, install test tools,
  or reproduce CI matrices by default. State a concrete affected behavior that
  requires escalation; keep routine local checks within two minutes total.
- Reuse passing evidence for unchanged code; reviewers do not rerun it by default.
- Do not delete or weaken existing tests/checks to make failures disappear.
- Report commands, results, and remaining uncertainty briefly; do not claim
  checks that were not run.
