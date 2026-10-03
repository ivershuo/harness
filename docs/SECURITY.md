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
- Verify exact planned file snapshots before mutation and again before each
  replacement; serialize cooperating Harness writers with an exclusive lock.
- Preserve POSIX modes and owner/group on replacement, or fail before exposing
  content if ownership cannot be preserved. ACLs and other extended metadata are
  not copied; repositories relying on them must review replacement behavior.
- Migrate only exact known default hooks; preserve custom commands and options.
- Validate complete manifest metadata, record states, and proposal paths.
- Store merge conflicts as explanatory reports, not drop-in replacements that
  could discard existing settings.
- Write ordinary files before the manifest so interrupted runs remain
  diagnosable.
- Do not fetch templates or execute target-project commands during init/update.
- Reject symlinks and oversized files in project detection and generated checks,
  as well as in reconciliation. Brain page symlinks fail diagnostics explicitly.

Observed symlinks are rejected. Portable filesystem APIs do not provide a complete
compare-and-swap operation against non-cooperating editors or malicious local
processes; a small check/rename race remains. Hooks are guidance and local
guardrails; CI remains the shared quality gate, and native runtime hook trust is
separate from files being installed.
