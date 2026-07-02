# Workflow: Feature Plan

Use this for non-trivial feature work.

## Steps

1. Read product, architecture, quality, security, and performance docs relevant
   to the feature.
2. Inspect existing code paths and tests before proposing changes.
3. Write a plan in `docs/agent/active-plans/<task>.md`.
4. Include goal, scope, non-goals, files or subsystems, acceptance criteria,
   verification commands, risks, and rollback notes.
5. Have the plan reviewed or explicitly accepted before implementation when the
   change touches multiple subsystems or public interfaces.

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
