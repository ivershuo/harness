# Claude Project Notes

Root `CLAUDE.md` imports `AGENTS.md`. Keep this file for Claude-specific
project behavior that should not apply to other agents.

- Prefer plan mode for changes touching multiple subsystems.
- Use subagents for broad investigation, review, security, and verification.
- Use `.claude/rules/` for path-scoped guidance instead of growing this file.
