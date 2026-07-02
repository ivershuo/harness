@AGENTS.md

## Claude Code

- Use `.claude/rules/` for path-scoped rules.
- Use `.claude/agents/` for planner, implementer, evaluator, reviewer, and
  security-reviewer roles.
- Use hooks for mandatory checks; `CLAUDE.md` is context, not enforcement.
- Keep auto memory useful but non-authoritative. Durable team knowledge belongs
  in `AGENTS.md`, `docs/`, skills, scripts, hooks, or CI.
