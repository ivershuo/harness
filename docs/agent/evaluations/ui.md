# Evaluation: UI

Use only for affected UI behavior. This checklist is not a requirement to start
a service/browser for every frontend edit. Follow `docs/QUALITY.md` local limits.

## Checks

- Copy, comments, color/token substitutions, and simple static styling default
  to diff inspection or an existing focused check; no automatic screenshots/tests.
- Use a browser when affected acceptance criteria need runtime/visual evidence,
  or on explicit request. A visual redesign/layout fix needs a representative
  preview/screenshot comparison. State what that evidence will establish.
- Reuse an existing preview. Do not start a fresh server just to obtain evidence
  already available; verify one representative affected flow/state first.
- Check viewport sizes, overflow, loading/empty/error/success states, and
  accessibility only where the change can affect them; do not sweep all states.
- Capture screenshots only to resolve a specific visual uncertainty or on
  request. Stop when sufficient evidence exists; reviewers reuse that evidence.
