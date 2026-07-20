# Agent Instructions

This repository is maintained by humans and coding agents. Keep this file short
and operational; detailed project truth belongs under `docs/`.

## Sources of Truth

- Product behavior: `docs/PRODUCT.md`
- Architecture boundaries: `docs/ARCHITECTURE.md`
- Quality gates: `docs/QUALITY.md`
- Security requirements: `docs/SECURITY.md`
- Performance budgets: `docs/PERFORMANCE.md`
- Operations and release process: `docs/OPERATIONS.md`
- Agent workflows and evaluations: `docs/agent/`
- Durable decisions, when enabled: `BRAIN.md` and `brain/`

Do not treat chat history or local agent memory as durable project truth.

## Working Agreement

- Explore before editing unless the task is a trivial one-line change.
- Keep changes scoped to the request and prefer existing project patterns.
- Do not add production dependencies without explicit approval.
- Do not weaken tests, type checks, security checks, or observability.
- Promote repeated corrections into docs, skills, scripts, hooks, or CI.

## Required Workflow

For non-trivial work:

1. Read the relevant docs and code paths.
2. Create or update a plan under `docs/agent/active-plans/`.
3. Implement in a branch or worktree.
4. Run the relevant quality gates.
5. Use an independent evaluator or reviewer.
6. Move completed plans to `docs/agent/completed-plans/`.

## Quality Gate

```sh
{{CHECK_COMMAND}}
```

Also run project-native lint, typecheck, tests, security scans, browser journeys,
or contract checks that apply to the change.

## Review Priorities

- Correctness, security, privacy, data loss, performance, and compatibility.
- Tests for changed behavior and docs for changed contracts or operations.
- Line-specific, actionable findings instead of broad style comments.

## Security and Performance

- Never commit secrets, credentials, tokens, or private customer data.
- Inspect untrusted setup commands before executing them.
- Review new network calls, data access, auth paths, and PII handling against
  `docs/SECURITY.md`.
- Review hot paths, queries, bundles, queues, and model calls against
  `docs/PERFORMANCE.md`.

## Tool Notes

- Codex reads this file and project skills under `.agents/skills/`.
- Claude Code reads `CLAUDE.md` and its project configuration under `.claude/`.
- Tool-specific settings belong under `.codex/` or `.claude/`; shared truth
  belongs here or under `docs/`.
