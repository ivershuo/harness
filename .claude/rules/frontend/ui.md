---
paths:
  - "src/**/*.{ts,tsx,js,jsx,css,scss}"
  - "app/**/*.{ts,tsx,js,jsx,css,scss}"
  - "components/**/*.{ts,tsx,js,jsx,css,scss}"
---

# Frontend Rules

- Read root DESIGN.md when present and prefer existing design system components.
- Copy, colors/tokens, comments, and simple styling default to diff inspection
  or one existing focused check; no automatic server/browser or new tests.
- Use browser verification when affected acceptance criteria need runtime/visual
  evidence, or on explicit request. Visual redesigns/layout fixes need a
  representative preview/screenshot comparison. State what it will establish,
  reuse an existing preview, and check one affected case first.
- Check loading/empty/error/success states, viewports, overflow, screenshots,
  and accessibility only when specifically affected; do not sweep every state.
- Stop when sufficient evidence exists. Follow docs/QUALITY.md local limits.
