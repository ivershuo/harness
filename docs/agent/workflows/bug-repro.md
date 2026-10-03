# Workflow: Bug Reproduction

Use this when fixing a defect or regression.

## Steps

1. Capture the symptom, expected behavior, actual behavior, and affected version.
2. Find the smallest code path that can explain the symptom.
3. Write or identify a failing test, fixture, screenshot, trace, or command that
   reproduces the issue.
4. Fix the root cause, not only the observed symptom.
5. Run the reproduction check; add a focused regression run only if it covers a
   separate affected risk. Reuse existing coverage and stop when relevant checks pass.
6. Document any new invariant in docs or tests.

## Output

Final work should include the reproduction signal, the fix, and verification
evidence.

Reproduction evidence can be an existing assertion, trace, or command. Do not
create new test files for trivial edits or start a service/browser when a
narrower reproduction suffices. Follow the local limits in `docs/QUALITY.md`.
