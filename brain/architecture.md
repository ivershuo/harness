# Architecture Memory

The harness separates guidance from enforcement.

- `AGENTS.md` and `CLAUDE.md` provide startup context.
- `docs/` stores durable project facts.
- `BRAIN.md` and `brain/` store durable decisions and rationale.
- `.agents/skills/` and `.claude/skills/` expose repeatable workflows.
- `.claude/rules/` and nested agent files provide scoped guidance.
- `.codex/` and `.claude/settings.json` configure tool-specific behavior.
- `scripts/agent/` provides executable checks that can run locally and in CI.

Agents can be guided by markdown, but important rules must be enforced by
scripts, hooks, permissions, tests, review, and CI.

See [[agent-harness-memory]].

