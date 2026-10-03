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

- CLI behavior changes have observable command output and regression coverage.
- Backward-incompatible behavior requires an explicit migration or release note.
- Seed files become project-owned immediately and are never overwritten.
- Plans stop when inspected files change, and simultaneous Harness writers are
  serialized rather than silently overwriting each other's results.
- User hook policies and existing POSIX mode bits and owner/group survive updates.
- Doctor validates schema records and rejects unsafe brain page paths.
- Default public commands install from the repository's `main` branch.

## Open Questions

- npm registry publication and marketplace plugins are deferred beyond v0.1.

## Selection

Both tools and brain are defaults; UI/API and GitHub CI are recommended when
detected. Explicit `--tools`, `--modules`, and `--ci` flags control initial
installation. Selections are additive on later reconciliation: the CLI has no
uninstall operation and does not remove previously installed targets. Required
skills remain part of each selected tool's contract.
