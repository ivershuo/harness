# Workflow: Brain Ingest

Use this when a chat, review, incident, research result, or implementation plan
produces durable knowledge that future agents should not rediscover.

## What Belongs

- architecture decisions
- product constraints
- rejected alternatives and why they were rejected
- security, performance, or operations lessons
- durable project context that is hard to infer from code

## What Does Not Belong

- raw chat transcripts
- task scratch notes
- command output
- implementation details obvious from code
- temporary plans that belong in `docs/agent/active-plans/`

## Steps

1. Decide whether the knowledge belongs in `docs/` or `brain/`.
2. Update `compiled_truth` only if the current authoritative answer changed.
3. Append a `timeline` entry for evidence, decisions, reversals, or notes.
4. Add or update wiki-links in `brain/index.md` or root pages.
5. Run `node scripts/agent/check.mjs --only brain`.
