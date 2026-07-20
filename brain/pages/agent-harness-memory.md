---
id: agent-harness-memory
title: Lightweight Project Brain for Agent Harness
category: decision
status: active
created: "2026-07-02"
updated: "2026-07-02"
---

## compiled_truth

This harness should include a lightweight project brain, but should not vendor
or require the external `brain.md` CLI by default.

The useful idea is durable, decision-grade memory with a current conclusion and
an evidence timeline. The reference harness can provide that convention with
plain Markdown plus `node scripts/agent/check.mjs --only brain`. Downstream teams that need
atomic writes or a richer CLI can adopt the external tool later.

## timeline

- time: 2026-07-02
  kind: decision
  summary: Added lightweight `BRAIN.md` and `brain/` convention to the harness
    instead of directly integrating an external CLI.
  source: projectbrain.md review
  affects: [AGENTS.md, README.md, scripts/agent/check.mjs]
