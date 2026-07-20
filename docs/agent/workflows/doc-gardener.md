# Workflow: Doc Gardener

Use this when maintaining agent and project docs.

## Steps

1. Remove stale commands, duplicated rules, and generic advice.
2. Move long procedures out of `AGENTS.md` and `CLAUDE.md` into workflows,
   skills, or docs.
3. Promote repeated corrections into scripts, hooks, or CI.
4. Check for context bloat, conflicting instructions, skill leakage, and stale
   setup commands.
5. Run `node scripts/agent/check.mjs --only instructions` and
   `node scripts/agent/check.mjs --only docs`.

## Output

Summarize what changed, what was removed, and which behavior the cleanup should
improve.
