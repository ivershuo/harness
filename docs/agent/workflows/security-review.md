# Workflow: Security Review

Use this for changes touching authentication, authorization, input handling,
secrets, logging, data access, network calls, or dependencies.

## Steps

1. Identify trust boundaries and sensitive data.
2. Check auth and authorization decisions.
3. Check input validation and output encoding.
4. Inspect logs and telemetry for sensitive data exposure.
5. Review dependency, command, and network changes.
6. Confirm tests or checks cover the security-sensitive behavior.

## Output

Report concrete risks, affected paths, exploitability, and specific fixes.
