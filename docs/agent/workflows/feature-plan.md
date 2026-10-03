# Workflow: Feature Plan

Use this for substantial functional changes or unresolved architecture/contract
tradeoffs. Documentation, copy, styling, and small local fixes do not need a
plan file or plan reviewer; multiple files alone are not a trigger.

## Steps

1. Read only docs/sections needed for the feature: product for behavior,
   architecture for boundaries, security/performance for affected risks, and
   quality for verification. Do not read the entire document set by default.
2. Inspect existing code paths and tests before proposing changes.
3. Write a plan in `docs/agent/active-plans/<task>.md`.
4. Include goal, scope, non-goals, files or subsystems, acceptance criteria,
   verification commands, risks, and rollback notes.
5. Review the plan before implementation only for a real unresolved architecture,
   security, data, or compatibility tradeoff. Otherwise use one final review.

Choose the smallest verification that proves the change. Read `docs/QUALITY.md`
for local limits; do not turn the plan into a list of every available test tool.

## Output Template

```md
# <Task Name>

## Goal
## Scope
## Non-Goals
## Approach
## Acceptance Criteria
## Verification
## Risks and Rollback
```
