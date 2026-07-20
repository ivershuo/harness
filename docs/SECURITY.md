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

## CLI File Safety

- Resolve every destination under the canonical Git project root.
- Reject absolute paths, path traversal, symbolic-link targets, and non-files.
- Preserve existing seed files and hash-guard managed updates.
- Store merge conflicts as explanatory reports, not drop-in replacements that
  could discard existing settings.
- Write ordinary files before the manifest so interrupted runs remain
  diagnosable.
- Do not fetch templates or execute target-project commands during init/update.
