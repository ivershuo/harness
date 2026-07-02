# Project Brain Protocol

This repository has a lightweight project brain in `brain/`.

Use it for durable, decision-grade knowledge: decisions, reversals, rationale,
constraints, and tradeoffs that are hard to reconstruct from code or docs and
will still matter months from now.

Do not use it for raw chat transcripts, implementation tours, temporary task
notes, logs, or facts that are obvious from the code.

## Read Order

Before non-trivial planning, read:

1. `brain/index.md`
2. The relevant root page in `brain/`
3. Any referenced page under `brain/pages/`
4. The corresponding project docs under `docs/`

## Root Pages

Root pages summarize project-wide memory:

- `brain/background.md`: why the project exists
- `brain/architecture.md`: durable architecture decisions
- `brain/flow.md`: important end-to-end flows
- `brain/mindmap.md`: project concept map
- `brain/stack.md`: technology and tooling choices
- `brain/roadmap.md`: sequencing and major milestones

Root pages are rewritten as the current understanding changes. Their history is
tracked by git.

## Decision Pages

Granular pages live under `brain/pages/`. Each page has:

- YAML frontmatter with `id`, `title`, `category`, `status`, `created`, and
  `updated`
- `## compiled_truth`: the current authoritative conclusion
- `## timeline`: append-only evidence, decisions, reversals, and notes

Allowed categories:

- `decision`
- `concept`
- `project`
- `person`
- `reference`

Allowed timeline kinds:

- `decision`
- `evidence`
- `reversal`
- `note`

Cross-references use wiki-link syntax, such as `[[agent-harness-memory]]`,
where the link target matches the page `id`.

## Write Rules

- Change `compiled_truth` only when you also append a `timeline` entry explaining
  why.
- Append timeline entries instead of deleting historical evidence.
- Keep entries concise and decision-grade.
- Run `scripts/agent/check-brain` after editing `BRAIN.md` or `brain/`.

