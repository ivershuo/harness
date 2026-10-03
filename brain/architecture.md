# Architecture Memory

Markdown guidance alone cannot reliably verify agent output. Shared executable
gates and independent evaluation are required; project-specific facts remain
versioned rather than buried in chat. The choice of lightweight local decision
memory is explained in [[agent-harness-memory]].

Harness distribution follows three ownership modes: project-owned seed files,
hash-guarded managed files, and structurally merged shared configuration. See
[[cli-distribution]].
