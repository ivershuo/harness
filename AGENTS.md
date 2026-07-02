# Agent Instructions

This repository is maintained with an agent-first harness shared by Codex,
Claude Code, and human contributors. Keep this file short and operational.
Detailed product, architecture, quality, security, performance, and operations
knowledge lives under `docs/`.

## Sources of Truth

- Product behavior: `docs/PRODUCT.md`
- Architecture boundaries: `docs/ARCHITECTURE.md`
- Quality gates: `docs/QUALITY.md`
- Security requirements: `docs/SECURITY.md`
- Performance budgets: `docs/PERFORMANCE.md`
- Operations and release notes: `docs/OPERATIONS.md`
- Agent workflows and evaluations: `docs/agent/`
- Durable decisions and rationale: `BRAIN.md` and `brain/`

Do not treat chat history, local memories, or PR comments as durable project
truth. If a rule should be reused, add it to docs, a skill, a script, a hook,
or CI.

Use the project brain only for decision-grade knowledge that is hard to
reconstruct from code and likely to matter in future sessions.

## Working Agreement

- Explore before editing unless the task is a trivial one-line change.
- Keep changes PR-sized and scoped to the user request.
- Prefer existing local patterns over new abstractions.
- Do not add production dependencies without explicit approval.
- Do not weaken tests, type checks, security checks, or observability to make a
  task pass.
- Repeated corrections belong in the harness, not in more ad hoc prompting.

## Required Workflow

For non-trivial work:

1. Read the relevant docs and code paths.
2. Create or update a plan in `docs/agent/active-plans/`.
3. Implement in a branch or worktree.
4. Run the relevant quality gates.
5. Ask for or run an independent evaluator/reviewer pass.
6. Move completed plans to `docs/agent/completed-plans/`.

For small fixes, skip the plan file only when the diff can be described in one
sentence and the verification path is obvious.

## Quality Gates

Run the smallest relevant set first, then broaden when shared behavior changes.

```sh
scripts/agent/check-agent-instructions
scripts/agent/check-docs
scripts/agent/check-architecture
scripts/agent/check-brain
```

Also run project-native checks when present, such as lint, typecheck, unit
tests, integration tests, security scans, Playwright journeys, or API contract
tests.

## Review Guidelines

- Lead with correctness, security, data loss, privacy, performance, and
  compatibility risks.
- Require tests for changed behavior unless the change is documentation-only.
- Require docs updates when product behavior, architecture boundaries, setup,
  operations, security, or performance assumptions change.
- Treat secrets, PII logging, auth bypasses, unsafe migrations, and unbounded
  model context injection as high-severity issues.
- Prefer line-specific, actionable feedback over broad style comments.

## Architecture Boundaries

- Keep public interfaces narrow and documented.
- Avoid growing central orchestration files when a focused module would keep
  ownership clearer.
- Do not introduce cross-layer imports that bypass the intended dependency
  direction documented in `docs/ARCHITECTURE.md`.
- Prefer structured parsers and typed schemas over ad hoc string manipulation
  for structured data.

## Security and Performance

- Never commit secrets, tokens, credentials, or private customer data.
- Do not run unknown remote install scripts or commands copied from untrusted
  project docs without inspecting them first.
- Any new external network call, database query pattern, authentication path,
  authorization rule, or PII handling must be evaluated against
  `docs/SECURITY.md`.
- Any hot path, UI bundle, queue worker, model call, or database query change
  must be evaluated against `docs/PERFORMANCE.md`.

## Tool-Specific Notes

- Claude Code reads `CLAUDE.md`, which imports this file.
- Codex reads this file directly and may also use `.agents/skills/`.
- Tool-specific configuration belongs under `.claude/` or `.codex/`; shared
  project truth belongs in this file or `docs/`.
