# Agent Harness

Install and maintain a shared repository harness for Codex, Claude Code, or both.
It provides project docs, task workflows, native tool adapters, quality checks,
and optional durable decision memory. The CLI uses only Node.js built-ins and
ships its templates in the package; installation fetches no extra templates.

## Install and Maintain

Run inside a Git repository with Node.js 20 or newer. Use Node 22 or 24 LTS for
maintained environments; Node 20 remains a legacy compatibility target.

```sh
npx --yes github:ivershuo/harness init
npx --yes github:ivershuo/harness doctor
npx --yes github:ivershuo/harness update
```

`init` detects the stack and CI, then displays a plan before writing. Defaults
include both tools and brain; UI/API modules are recommended when detected.
`update` requires a clean worktree unless you supply `--allow-dirty`.
Use `--dry-run` to inspect changes and `--yes` for non-interactive application.
For reproducible setup or rollback, pin an existing release, for example
`github:ivershuo/harness#v0.1.2`.

## Start Small

Install only the tool and modules the project needs. A minimal Codex setup is:

```sh
npx --yes github:ivershuo/harness init --tools codex --modules none --ci none
```

Catalog target counts, excluding `.agent-harness/manifest.json` and optional CI:

| Tools | Optional modules | Targets |
| --- | --- | ---: |
| Codex | none | 31 |
| Claude Code | none | 41 |
| Both | none | 49 |
| Both | brain | 61 |

GitHub CI adds one target. UI/API modules add their evaluation and selected tool
rules. Native skills and role files have separate paths because the tools discover
them there; their procedures live in shared workflows rather than duplicate text.

Selections are additive: later init/update can add tools or modules, but passing
`--modules none` does not uninstall previous selections. The CLI does not remove
installed files. Do not delete required tracked skills to reduce an existing
installation; checker and doctor report those as missing.

## Ownership and Safe Updates

Commit `.agent-harness/manifest.json` with the shared harness files. The manifest
records selection, template versions, hashes, ownership, and pending proposals:

- **Seed:** project facts such as product, architecture, and brain docs. Existing
  content stays project-owned; required adaptations become proposals.
- **Managed:** workflows, skills, evaluations, and scripts. Update replaces them
  only when their recorded content still matches; custom edits become proposals.
- **Merged:** shared settings. The CLI reconciles managed blocks or JSON defaults
  while preserving custom hooks, matcher groups, and handler options.

Review proposals under `.agent-harness/proposals/<version>/`, resolve deliberately,
then rerun `doctor`. Plans stop when inspected content changes. Writers use an
exclusive lock and preserve existing POSIX mode and owner/group. See
[security guarantees and limits](docs/SECURITY.md) and
[lock recovery](docs/OPERATIONS.md).

The CLI merges local agent state and report ignores into `.gitignore`; retain
project-specific dependency, environment, and secret patterns. The committed
harness files and manifest are shared state, not local scratch files.

## Hooks and Checks

Both tool adapters invoke the installed `scripts/agent/stop-hook.mjs`. It locates
the Git root, checks instruction hygiene, emits JSON, and requests at most one
repair continuation. Missing scripts or invalid event input produce a warning
and require manual checks. Full quality gates still run in CI.

In Codex, review and trust changed definitions with `/hooks`. Installation and
`doctor` success do not establish runtime hook trust. Protocol references:
[Codex Hooks](https://learn.chatgpt.com/docs/hooks) and
[Claude Code Hooks](https://code.claude.com/docs/en/hooks).

Run the generated gate in the target repository:

```sh
node scripts/agent/check.mjs
```

Use `--only instructions`, `docs`, `architecture`, `brain`, or `templates` for a
focused scope. Keep its managed `manifest-schema.mjs` and `stop-hook.mjs` siblings.
The checker validates harness structure and requirements; add project-native
lint, typecheck, tests, security, and browser gates alongside it.

Repository CI/release gates are:

```sh
npm test
npm run check
npm run verify:package
```

Local edits use the smallest useful check, not this entire list. Small changes
do not trigger service/browser startup, full builds, or extra reviewers by
default; stop after sufficient evidence. See [local verification limits](docs/QUALITY.md).

## Where Content Belongs

- `AGENTS.md`: short operational entrypoint; `CLAUDE.md` imports it.
- `DESIGN.md`, when present at the root: read before design/UI work and follow
  as the project's design rules. The harness does not create or require it.
- [Product](docs/PRODUCT.md), [architecture](docs/ARCHITECTURE.md),
  [quality](docs/QUALITY.md), [security](docs/SECURITY.md),
  [performance](docs/PERFORMANCE.md), and [operations](docs/OPERATIONS.md):
  project facts and contracts.
- [Agent workflows and plans](docs/agent/index.md): repeatable procedures and
  verification records; native skill files point to these workflows.
- [Brain protocol](BRAIN.md) and [brain index](brain/index.md): decisions,
  alternatives, reversals, and rationale that code cannot explain. Temporary
  notes and implementation tours belong elsewhere.

Fill project-owned docs with actual project knowledge after installation.
Promote repeated corrections into focused docs, scripts, or CI, and remove stale
rules. Markdown supplies context; executable gates and independent evaluation
provide verification. This harness does not replace project-native tests.
