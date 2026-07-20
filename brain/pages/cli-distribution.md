---
id: cli-distribution
title: CLI Distribution and File Ownership
category: decision
status: active
created: "2026-07-20"
updated: "2026-07-20"
---

## compiled_truth

Agent Harness uses a dependency-free Node.js 20+ CLI as its primary public
distribution mechanism. The CLI packages its templates, so initialization and
updates do not fetch content from another branch or service at runtime.

The target repository owns seed files, the framework hash-guards managed files,
and shared configuration is merged through explicit blocks or structured JSON.
Conflicts produce local proposals instead of overwriting project content.

The public GitHub command resolves `main` by default. Development branches are
not public installation channels; semantic version tags exist for pinning and
rollback. Native Codex and Claude Code marketplace plugins may later distribute
reusable capabilities, but they will not own project facts.

## timeline

- time: 2026-07-20
  kind: decision
  summary: Chose a GitHub-installed Node CLI with seed, managed, and merged file
    ownership as the v0.1 adoption and update mechanism.
  source: CLI distribution design and implementation
  affects: [README.md, package.json, src, templates, .agent-harness/manifest.json]
- time: 2026-07-20
  kind: decision
  summary: Established main as the only default public installation source and
    deferred native marketplaces until after the CLI stabilizes.
  source: release-channel decision
  affects: [README.md, docs/OPERATIONS.md]
