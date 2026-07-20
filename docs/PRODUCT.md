# Product

Agent Harness is a repository initializer and maintenance tool for projects that
use Codex, Claude Code, or both.

## Users and Jobs

- Primary users: public project maintainers adopting coding agents.
- Core jobs: initialize a harness, validate it, and safely receive framework
  updates without overwriting project knowledge.
- Non-goals: installing coding-agent runtimes, publishing npm packages, or
  replacing project-native tests and CI.

## Core Flows

- `init`: inspect a Git repository, present the selected modules, then install
  or merge files and record ownership.
- `doctor`: report missing, modified, conflicting, or pending harness state.
- `update`: apply new managed files only when their recorded hash still matches;
  otherwise create a proposal and preserve the project file.

## Acceptance Standards

- Behavior changes should be observable through tests, UI checks, API examples,
  or documented manual verification.
- Copy and UX changes should match the product voice.
- Backward-incompatible behavior requires an explicit migration or release note.
- Seed files become project-owned immediately and are never overwritten.
- Default public commands install from the repository's `main` branch.

## Open Questions

- npm registry publication and marketplace plugins are deferred beyond v0.1.
