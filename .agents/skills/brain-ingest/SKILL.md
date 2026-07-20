---
name: brain-ingest
description: Capture durable project decisions, rationale, reversals, and constraints into BRAIN.md/brain after a task, review, incident, or research result.
---

Follow `BRAIN.md` and `docs/agent/workflows/brain-ingest.md`.

Do not store raw transcripts or temporary task notes. Update `compiled_truth`
only when the current authoritative answer changes, and append a timeline entry
explaining why. Run `node scripts/agent/check.mjs --only brain` after changes.
