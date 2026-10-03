# Evaluation: Security

Use for security-sensitive changes.

Focus on the affected trust boundary and reuse existing evidence. Do not install
scanners, run broad audits, or start services by default; escalate only for a
specific uncovered risk under `docs/QUALITY.md`. One reviewer can cover security
within the final review rather than triggering a separate review chain.

## Checks

- No secrets or sensitive data are committed or logged.
- Auth and authorization are enforced at the right boundary.
- Inputs are validated and outputs are encoded where needed.
- New dependencies, scripts, and network calls are justified.
- Security tests or manual verification evidence are included.
