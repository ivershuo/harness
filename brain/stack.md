# Stack Memory

This reference harness is intentionally stack-neutral.

Baseline tooling:

- Markdown for context, docs, workflows, and project memory
- Node.js 20+ for the cross-platform CLI and executable checks
- JSON/TOML/Starlark-style config for tool-specific behavior

The CLI uses only Node.js standard-library APIs and ships templates in the same
package, so installation does not add runtime dependencies or fetch templates
from another branch.
