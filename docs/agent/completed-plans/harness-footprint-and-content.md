# Harness Footprint and Content

## Goal

Reduce duplicate package sources and documentation while preserving installed
interfaces, safety gates, tool behavior, and upgrade ownership.

## Scope

- Reuse canonical Claude notes and brain protocol instead
  of maintaining second copies under templates.
- Render both tools' skill files from canonical Codex skill sources, preserving
  Claude's explicit manual-invocation policy through a catalog adapter.
- Move the Stop command constant into the existing constants module.
- Shorten README to adoption, selection, ownership, hooks, checks, and docs links.
- Fix contradictory deletion guidance and generic performance placeholders.

## Non-Goals

- Changing default module selection or deleting existing downstream files.
- Merging security/quality/product docs, native agents, or regression suites only
  to lower file count.
- Removing decision timelines or historical plans.
- Adding dependencies, weakening gates, or publishing.

## Approach

Baseline: 126 repository files (excluding Git/dependencies), 79 package files,
61 default dual-tool/brain targets and 31 minimal Codex targets (CI excluded).
Target 72 package files by removing six duplicate packaged skill sources and a
constants-only module. The two removed templates are replaced in the package
by their canonical documents; they reduce repository duplication, not package
file count. Keep the same catalog targets.

The `claude-skill` catalog adapter accepts only an explicit frontmatter document,
adds `disable-model-invocation: true`, rejects conflicting invocation metadata,
and accepts only flat `name`/`description` metadata rather than partially parsing
arbitrary YAML. It otherwise preserves canonical skill content. Keep native
repository adapters for local tool discovery. Freeze removed historical template content
in the existing upgrade fixture loader; historical catalog data stays frozen.
Keep the merged CLAUDE template separate: using its target as its own source
would create nested managed blocks when reconciling the source repository.

## Acceptance Criteria

- All installed target paths and ownership modes remain unchanged.
- Claude generated skills retain manual invocation and share canonical bodies.
- Package contains every catalog source and runs without repository-only files.
- README documents minimal installation and additive selection semantics;
  it no longer advises deleting required tracked skills.
- Template performance guidance requests applicable measured budgets rather
  than assuming every project has pages, databases, bundles, and model calls.
- Existing tests plus targeted rendering/packed-runtime assertions pass.
- Independent plan and final review complete.

## Verification

Focused catalog/packed-package/upgrade tests, then `npm test`, `npm run check`,
`npm run verify:package`, and `git diff --check`. Compare README lines and package
file count, without hard size assertions.

## Risks and Rollback

Canonical source changes affect future installs and managed updates. Seed docs
remain project-owned; custom managed files still become proposals. Preserve
tool-specific invocation metadata and reject unknown render adapters. Restore
the duplicate sources/catalog with Git to roll back; no downstream file deletion
or unrequested module removal occurs.

## Results — 2026-10-03

Implemented on `codex/harness-safety-and-adapters`, alongside the unreleased
0.1.1 safety maintenance. No commit, release, or downstream deletion performed.

| Measure | Before | After |
| --- | ---: | ---: |
| Repository files, excluding Git/dependencies | 126 | 124 |
| Package files | 79 | 72 |
| README lines | 359 | 121 |
| Repository BRAIN protocol lines | 69 | 33 |

Three redundant source files were removed; this completed plan adds one record.
The previous duplicate BRAIN template had 23 lines; its replacement now includes
the full decision-page contract, so downstream BRAIN content grows by ten lines
while repository protocol duplication disappears. Existing seed files are not
overwritten. Installed target counts remain 31/41/49/61 for the documented
selections, excluding the manifest and optional CI.

Content improvements: corrected the recommendation to delete required skills,
documented additive selection and minimal installation, replaced duplicated
ignore/operating instructions with focused links, clarified local hooks versus
shared CI gates, removed reconstructable directory tours from architecture
memory, and replaced unrelated empty performance fields with measured-budget
guidance. Tool-native repository adapters and separate project fact documents
remain because they have independent discovery or ownership roles.

Verification on macOS, Node 24.12.0, npm 11.12.1:

- `npm test`: **47/47 passed**.
- `npm run check`: all five scopes passed.
- `npm run verify:package`: 72 files; passed.
- `git diff --check`: passed.
- Packed dual-tool and Claude-only installs passed checks, doctor, idempotency,
  and nested Stop hooks; all six Claude skills retain manual-invocation policy
  and the canonical body without packaged Claude skill source duplicates.
- Compatibility regression verifies historical targets, modules, and ownership;
  removed/changed legacy Claude template text remains frozen in upgrade tests.
- Independent plan/final review passed. Quoted invocation-key ambiguity found
  by the evaluator was corrected with constrained metadata validation and
  regressions; final evaluation reported no remaining actionable findings.

Native Windows/Linux and live tool hook sessions were not run locally; CI still
provides the configured platform matrix. Smaller packaging and startup docs are
measured here; no CLI speed improvement is claimed.
