# Agent Harness

This directory holds reusable workflows, evaluations, decisions, and task plans.

## Directory Map

- `workflows/`: repeatable task procedures used by skills.
- `evaluations/`: independent verification playbooks.
- `active-plans/`: current task plans for non-trivial work.
- `completed-plans/`: finished task plans with results and follow-up notes.
- `decisions/`: architecture or harness decisions that should outlive a chat.

## Maintenance Rules

- Keep startup files short; move detailed procedures into workflows or skills.
- Retire stale plans after work lands.
- Convert repeated mistakes into scripts, hooks, rules, or focused docs.
- Review this directory when adding new agent tools or changing team workflow.
