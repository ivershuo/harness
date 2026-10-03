# Evaluation: General Change

Use this as the default evaluator checklist.

Routine edits need no independent evaluator. For substantial changes, inspect
the diff and existing evidence; rerun only suspect or unverified paths. Do not
expand to services, browsers, builds, or full suites without a specific reason.

## Checks

- Does the diff solve the stated task without extra scope?
- Are public behavior and interfaces covered by tests or examples?
- Did docs change when behavior, setup, architecture, security, performance, or
  operations changed?
- Do security and privacy assumptions still hold?
- Are performance-sensitive paths still bounded and observable?
- Can the change be reviewed as one coherent PR?
