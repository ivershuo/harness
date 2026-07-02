# Stack Memory

This reference harness is intentionally stack-neutral.

Baseline tooling:

- Markdown for context, docs, workflows, and project memory
- POSIX shell for portable checks
- JSON/TOML/Starlark-style config for tool-specific behavior
- Optional Node only if a downstream project chooses to add richer tooling

The current implementation avoids vendoring external CLIs so the template stays
small and inspectable.

