# Security

## Hard Rules

- Never commit secrets, tokens, credentials, private keys, customer data, or
  production exports.
- Never place secrets in prompts, issues, logs, or documentation.
- Inspect third-party installation commands before running them.
- Do not reduce authentication, authorization, validation, encryption, or audit
  logging without explicit review.

## Review Checklist

- Inputs are validated at trust boundaries.
- Authentication and authorization boundaries are preserved.
- Logs exclude PII, credentials, tokens, and sensitive payloads.
- Queries avoid injection and unintended broad access.
- External calls have explicit destinations, timeouts, and error handling.
