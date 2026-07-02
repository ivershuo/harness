# Agent Harness Reference

This repository is a portable reference harness for multi-person projects that
use Codex and Claude Code. It gives agents a small, shared project entrypoint,
keeps durable knowledge in structured docs, and moves mandatory behavior into
scripts, hooks, rules, and CI-ready checks.

## What This Framework Is

The harness is not a prompt library. It is a project operating system for AI
coding agents:

- `AGENTS.md` is the shared, short agent entrypoint.
- `CLAUDE.md` adapts the shared entrypoint for Claude Code.
- `docs/` is the durable source of truth for product, architecture, quality,
  security, performance, and operations.
- `docs/agent/` stores reusable workflows, evaluations, decisions, active
  plans, and completed plans.
- `BRAIN.md` and `brain/` store durable decisions, rationale, constraints, and
  reversals that future agents should not rediscover.
- `.agents/skills/` exposes reusable workflows to Codex.
- `.claude/skills/`, `.claude/rules/`, and `.claude/agents/` expose the same
  concepts through Claude Code's native mechanisms.
- `.codex/` contains Codex project configuration, hooks, and command rules.
- `scripts/agent/` contains executable checks that can run locally, in hooks,
  and in CI.

The design follows one rule: markdown provides context, but enforcement belongs
in executable checks.

## Why This Exists

Agent-written code fails in predictable ways when project knowledge is scattered
across chats, PR comments, private memories, and stale docs. This harness makes
the important parts explicit:

- where agents should look for facts;
- how they should plan non-trivial work;
- what must be verified before work is accepted;
- which risks reviewers should prioritize;
- when repeated corrections should become automation.

It also keeps startup context intentionally small. Large `AGENTS.md` or
`CLAUDE.md` files can make agents slower, more expensive, and less reliable.
Put only high-frequency, non-obvious, correctness-affecting rules in startup
files.

## Repository Layout

```text
AGENTS.md
CLAUDE.md
docs/
  ARCHITECTURE.md
  PRODUCT.md
  QUALITY.md
  SECURITY.md
  PERFORMANCE.md
  OPERATIONS.md
  agent/
BRAIN.md
brain/
.agents/skills/
.codex/
.claude/
.mcp.json
scripts/agent/
```

## How To Use This In A Real Project

Do not blindly copy every file and call it done. Use this harness as a seed,
then adapt it to the project.

1. Start with `AGENTS.md` and `CLAUDE.md`.
   Keep `AGENTS.md` under 150 lines. Remove anything that is generic, obvious,
   or already enforced by tools. Keep `CLAUDE.md` as a thin adapter that imports
   `AGENTS.md`.

2. Fill the docs with project truth.
   Put product behavior in `docs/PRODUCT.md`, dependency boundaries in
   `docs/ARCHITECTURE.md`, security requirements in `docs/SECURITY.md`, and
   performance budgets in `docs/PERFORMANCE.md`.

3. Seed the project brain deliberately.
   Use `BRAIN.md` and `brain/` for decision-grade knowledge: durable decisions,
   rejected alternatives, rationale, reversals, and constraints. Do not store raw
   transcripts or temporary task notes there.

4. Map existing commands into `scripts/agent/`.
   The included checks validate the harness itself. Add wrappers for your real
   lint, typecheck, unit test, integration test, Playwright, security, and API
   contract checks.

5. Add only useful skills.
   Keep the provided workflow skills if they match your team. Delete unused
   ones. Add project-specific skills only for workflows that happen repeatedly.

6. Add path-scoped Claude rules.
   Use `.claude/rules/` for frontend, API, database, infra, or package-specific
   rules. Keep broad rules out of startup context when they only apply to one
   part of the repo.

7. Connect external systems through MCP.
   Add MCP servers only when agents need live access to GitHub, issue trackers,
   Figma, browser automation, docs, observability, or databases. Start small.

8. Put hard requirements in CI.
   Hooks help local runs, but CI is the real shared gate. Run the `scripts/agent`
   checks in CI alongside project-native checks.

9. Maintain the harness like code.
   When an agent repeats a mistake twice, update a doc, skill, script, hook, or
   CI check. When rules become stale, delete them.

## Recommended Ignore Rules

Projects adopting this harness should commit shared rules, docs, skills, and
checks, but ignore local overrides, secrets, sessions, scratch space, and
generated reports.

Add these entries to the target project's `.gitignore` and merge them with its
language-specific ignores:

```gitignore
# Local agent/session state
AGENTS.override.md
CLAUDE.local.md
.codex-log/
.codex/sessions/
.codex/tmp/
.claude/local/
.claude/sessions/
.claude/tmp/
docs/agent/scratch/
brain/scratch/

# Secrets and local environment
.env
.env.*
!.env.example
*.pem
*.key
*.p12
*.pfx
secrets/

# Local MCP or brain preferences
.mcp.local.json
.mindmux/preferences.json

# Test and browser reports
coverage/
test-results/
playwright-report/
reports/
logs/
*.log
```

Do not ignore these by default, because they are the shared harness:

```text
AGENTS.md
CLAUDE.md
BRAIN.md
brain/
docs/agent/
.agents/skills/
.claude/rules/
.claude/skills/
.claude/agents/
.claude/settings.json
.codex/config.toml
.codex/hooks.json
.codex/rules/
scripts/agent/
.mcp.json
```

## Lightweight Project Brain

This template includes a small, local version of the idea from
[`projectbrain.md`](https://projectbrain.md/). The goal is to keep persistent
project memory in plain Markdown without requiring an external runtime.

Use the brain when a conclusion should survive across sessions:

- why a technical direction was chosen;
- which alternatives were rejected;
- which constraints shape future work;
- what reversed and why;
- what future agents should know before planning related work.

Each page under `brain/pages/` has two parts:

- `compiled_truth`: the current authoritative understanding;
- `timeline`: append-only decisions, evidence, reversals, and notes.

This is intentionally lighter than the full external `brain.md` CLI. It gives us
the convention and checks now; teams that need atomic writes, a richer CLI, or
installable skills can adopt the external project later.

## Adoption Paths Beyond Copying Files

There are better rollout patterns than copying this directory into every repo:

- Create an internal template repository for new projects.
- Package common Codex skills and MCP setup as a Codex plugin.
- Keep shared Claude rules or skills in a central repo and symlink or vendor
  them into projects.
- Publish a small bootstrap script that installs the baseline files and asks
  project-specific questions before writing docs.
- Add a CI check that compares each repo's harness against a versioned baseline.
- Use a periodic "doc gardener" task to detect stale commands, oversized
  startup files, missing security/performance docs, and unused skills.

For mature organizations, use a layered model:

- organization baseline: security, privacy, compliance, review policy;
- project harness: product, architecture, commands, local workflows;
- local overrides: personal preferences and machine-specific setup only.

## Can This Force Agents To Obey?

No markdown file can guarantee full compliance. `AGENTS.md`, `CLAUDE.md`, rules,
and skills are context. Agents usually follow them, but they are not a security
boundary and not a proof of correctness.

Use this model instead:

- **Guidance:** `AGENTS.md`, `CLAUDE.md`, docs, rules, and skills tell agents
  what good work looks like.
- **Friction:** permissions, sandboxing, allowlists, and hooks make risky
  actions harder.
- **Enforcement:** scripts, tests, type checks, linters, security scans, and CI
  decide whether work can land.
- **Independent evaluation:** reviewer/evaluator agents or humans inspect work
  from a fresh context.
- **Auditability:** plans, completed plans, PRs, logs, and decision records make
  the process inspectable.

The practical goal is not perfect obedience. The goal is to make the correct
path the easiest path, make dangerous actions visible, and make unacceptable
output fail automatically.

## Included Checks

Run these from the repository root:

```sh
scripts/agent/check-agent-instructions
scripts/agent/check-docs
scripts/agent/check-architecture
scripts/agent/check-brain
```

They currently verify the harness structure, required docs, skill parity between
Codex and Claude Code, Claude subagents, brain page structure, and the
size/import discipline of the startup files.

## Maintenance Checklist

Review this harness periodically:

- Is `AGENTS.md` still under 150 lines?
- Are stale commands removed?
- Are security and performance requirements explicit?
- Are repeated review comments now automated?
- Are durable decisions captured in `brain/` instead of buried in chat?
- Are unused skills, rules, and subagents removed?
- Do CI checks enforce the rules that matter most?
- Do agents have a reliable evaluator path for non-trivial work?
