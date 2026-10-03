# Performance

The CLI must remain dependency-free, operate on declared templates and selected
project metadata, and avoid runtime network or model calls.

## Budgets

- Individual project files: at most 5 MiB in detection, reconciliation, and checks.
- Stop adapter input/output: at most 64 KiB input and 4,000 characters of failing
  checker feedback; one automatic continuation per Stop chain.
- Stop checker: 20 second execution timeout inside the 30 second Codex hook.
- Runtime external network and model calls: zero.
- Install/update work scales with selected catalog entries. Doctor additionally
  visits project-owned brain pages; it does not scan dependency directories.
- Local SSD reference targets: default init below 2 seconds, doctor and Stop
  instruction checks below 1 second. These are regression-investigation targets,
  not machine-independent CI timing assertions.

## Review Checklist

- Avoid repeated template reads or whole-project discovery scans.
- Keep generated checks independent of package-cache imports.
- Maintain explicit input-size, subprocess-output, and timeout bounds.
- Inspect large brain collections separately when diagnosing doctor latency.

## Verification

Use fresh temporary Git repositories for timing init, doctor, and hooks. Compare
package size through `npm run verify:package`. Avoid hard wall-clock assertions
in shared CI because operating systems, filesystem caches, and runners vary.
