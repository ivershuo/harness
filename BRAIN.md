# Project Brain Protocol

Keep durable decisions, reversals, rationale, constraints, and rejected
alternatives under `brain/`. Record knowledge that is hard to reconstruct and
likely to matter in later sessions. Exclude transcripts, temporary notes, logs,
and implementation facts already available in code or project docs.

## Read Order

Consult the brain when the task needs prior decisions or rationale. This order
is for that lookup, not a required startup sequence for every edit.

1. `brain/index.md`
2. Relevant root pages under `brain/`
3. Referenced decision pages under `brain/pages/`
4. Corresponding project docs under `docs/`

## Decision Page Contract

Each Markdown page under `brain/pages/` needs YAML frontmatter with `id`, `title`,
`category`, `status`, `created`, and `updated`, plus these sections:

- `## compiled_truth`: the current authoritative conclusion.
- `## timeline`: append-only evidence, decisions, reversals, and notes.

Categories: `decision`, `concept`, `project`, `person`, `reference`.
Timeline kinds: `decision`, `evidence`, `reversal`, `note`.
Link pages as `[[page-id]]`, matching the frontmatter `id`.

## Write Rules

- Change `compiled_truth` only with a new timeline entry explaining why.
- Preserve historical evidence; keep entries concise and decision-grade.
- Update `updated` and the index when pages change or are added/retired.
- Keep root pages as current summaries; Git records their history.
- Run `node scripts/agent/check.mjs --only brain` after changes.
