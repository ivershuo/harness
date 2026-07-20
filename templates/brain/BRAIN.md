# Project Brain Protocol

This repository keeps durable, decision-grade knowledge under `brain/`.

Use it for decisions, reversals, rationale, constraints, and tradeoffs that are
hard to reconstruct and likely to matter in future sessions. Do not use it for
raw transcripts, temporary task notes, logs, or implementation details obvious
from code.

## Read Order

1. `brain/index.md`
2. Relevant root pages under `brain/`
3. Referenced pages under `brain/pages/`
4. Corresponding project docs under `docs/`

## Decision Pages

Each page under `brain/pages/` contains YAML frontmatter, `compiled_truth`, and
an append-only `timeline`. Update the current truth only when adding a timeline
entry that explains why.

Run `node scripts/agent/check.mjs --only brain` after editing the project brain.
