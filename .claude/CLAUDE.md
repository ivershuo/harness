# Claude Project Notes

Root CLAUDE.md imports AGENTS.md. Keep this file for Claude-specific behavior.

- Routine edits do not need plan mode, subagents, or independent reviewers.
- Use a plan and one final reviewer for substantial functional/high-risk changes;
  plan review is reserved for unresolved architecture/contract tradeoffs.
- Follow docs/QUALITY.md local verification limits. Reuse passing evidence;
  do not spawn separate testing, browser, and security agents by default.
- Use .claude/rules/ for scoped guidance instead of growing this file.
