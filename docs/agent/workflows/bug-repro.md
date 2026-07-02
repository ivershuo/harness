# Workflow: Bug Reproduction

Use this when fixing a defect or regression.

## Steps

1. Capture the symptom, expected behavior, actual behavior, and affected version.
2. Find the smallest code path that can explain the symptom.
3. Write or identify a failing test, fixture, screenshot, trace, or command that
   reproduces the issue.
4. Fix the root cause, not only the observed symptom.
5. Run the reproduction check and the nearest regression suite.
6. Document any new invariant in docs or tests.

## Output

Final work should include the reproduction signal, the fix, and verification
evidence.
