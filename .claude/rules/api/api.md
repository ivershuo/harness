---
paths:
  - "src/api/**/*"
  - "api/**/*"
  - "server/**/*"
  - "routes/**/*"
---

# API Rules

- Validate inputs at the boundary.
- Preserve documented error shapes.
- Keep auth and authorization checks close to the entry point.
- Add contract or integration tests for public API changes.
