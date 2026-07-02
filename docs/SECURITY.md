# Security

Security guidance applies to humans, Codex, Claude Code, and automation.

## Hard Rules

- Never commit secrets, credentials, tokens, private keys, customer data, or
  production exports.
- Never paste secrets into prompts, issues, logs, or docs.
- Inspect third-party install scripts and project setup commands before running
  them.
- Do not reduce auth, authorization, validation, encryption, or audit logging
  without explicit review.

## Review Checklist

- Authentication and authorization boundaries are preserved.
- Inputs are validated at trust boundaries.
- Logs do not include PII, secrets, tokens, session identifiers, or sensitive
  payloads.
- Database queries avoid injection and unintended broad reads/writes.
- External calls have clear domains, timeouts, and error handling.
- Migrations have rollback or recovery notes.

## Agent-Specific Risks

Agents can be induced to run unsafe commands from seemingly normal project docs.
Prefer allowlisted commands, hooks, sandboxing, and code inspection before
execution. Unknown repositories and generated scripts require extra scrutiny.
