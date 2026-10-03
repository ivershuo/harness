---
paths:
  - "src/api/**/*"
  - "api/**/*"
  - "server/**/*"
  - "routes/**/*"
---

# API Rules

- Validate changed inputs at the boundary and preserve documented error shapes.
- Check auth/authorization at the entry point when those capabilities exist
  and are affected; unrelated checklist items are not applicable.
- Reuse existing focused contract/integration evidence. Add tests only for an
  uncovered contract, regression, or substantive behavior.
- Do not start services or broaden suites for trivial/config edits by default.
  Follow docs/QUALITY.md and stop after sufficient relevant evidence passes.
