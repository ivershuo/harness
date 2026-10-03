import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { loadCatalog, renderEntry, selectEntries } from "../src/catalog.mjs";
import { hashContent, stableJson } from "../src/fs-safe.mjs";
import { HARNESS_VERSION } from "../src/constants.mjs";
import { mergeBlock } from "../src/merge.mjs";
import { manifest, packageRoot, repository, run, runCli, runHook } from "./helpers.mjs";

// Freeze the old catalog and the templates changed by this maintenance version.
const fixtureRoot = path.join(packageRoot, "test/fixtures/v0.1.0");
const overrides = new Map([
  ["scripts/agent/check.mjs", "check.mjs.fixture"],
  [".codex/hooks.json", "codex-hooks.json"],
  [".claude/settings.json", "claude-settings.json"],
  [".gitignore", "gitignore"],
]);

// Freeze the removed notes template; do not replace old bytes with new sources.
const legacyNotes = `# Claude Project Notes

Root \`CLAUDE.md\` imports the shared \`AGENTS.md\`. Keep this file limited to
Claude-specific project behavior.

- Prefer plan mode for changes touching multiple subsystems.
- Use subagents for broad investigation, evaluation, security, and testing.
- Use \`.claude/rules/\` for path-scoped guidance.
`;
const legacyClaude = `@AGENTS.md

## Claude Code

- Use \`.claude/rules/\` for path-scoped rules.
- Use \`.claude/agents/\` for specialized planner, implementer, evaluator, review,
  test, and debugging roles.
- Treat hooks as enforcement and Markdown as context.
- Keep durable team knowledge in project files, not auto memory.
`;
const legacyText = new Map([[".claude/CLAUDE.md", legacyNotes], ["CLAUDE.md", legacyClaude]]);

test("catalog compaction preserves legacy target paths, modules and ownership", async () => {
  const old = JSON.parse(await readFile(path.join(fixtureRoot, "catalog.json"), "utf8")).files;
  const current = await loadCatalog();
  const legacyTargets = new Set(old.map((entry) => entry.target));
  const contract = ({ target, module, tool, ownership, merge, markerStyle, executable }) =>
    ({ target, module, tool, ownership, merge, markerStyle, executable });
  assert.deepEqual(current.filter((entry) => legacyTargets.has(entry.target)).map(contract), old.map(contract));
  assert.deepEqual(current.filter((entry) => !legacyTargets.has(entry.target)).map((entry) => entry.target),
    ["scripts/agent/manifest-schema.mjs", "scripts/agent/stop-hook.mjs"]);
});

async function legacyInstall(root) {
  const catalog = JSON.parse(await readFile(path.join(fixtureRoot, "catalog.json"), "utf8"));
  const selection = { tools: ["claude", "codex"], modules: [], ci: "none" };
  const files = {};
  for (const entry of selectEntries(catalog.files, selection)) {
    const desired = legacyText.has(entry.target) ? legacyText.get(entry.target) : overrides.has(entry.target)
      ? await readFile(path.join(fixtureRoot, overrides.get(entry.target)), "utf8")
      : await renderEntry(entry, { PROJECT_NAME: "Legacy fixture", DATE: "2026-07-20", CHECK_COMMAND: "node scripts/agent/check.mjs", PROJECT_GATES: "- npm test" });
    const content = entry.ownership === "merged" && entry.merge === "block" ? mergeBlock(null, desired, entry) : desired;
    await mkdir(path.dirname(path.join(root, entry.target)), { recursive: true });
    await writeFile(path.join(root, entry.target), content);
    files[entry.target] = {
      ownership: entry.ownership, module: entry.module, templateVersion: "0.1.0",
      templateHash: hashContent(desired), installedHash: hashContent(content),
      state: entry.ownership === "seed" ? "project-owned" : entry.ownership,
    };
  }
  await mkdir(path.join(root, ".agent-harness"));
  await writeFile(path.join(root, ".agent-harness/manifest.json"), stableJson({
    schemaVersion: 1, harnessVersion: "0.1.0", source: "github:ivershuo/harness",
    installedAt: "2026-07-20T00:00:00.000Z", updatedAt: "2026-07-20T00:00:00.000Z",
    selection, files, pending: {},
  }));
}

test("v0.1.0 update migrates managed checks and adapters while preserving project seeds", async (t) => {
  const root = await repository(t);
  await legacyInstall(root);
  const seedPath = path.join(root, "docs/PRODUCT.md");
  await writeFile(seedPath, "# Existing product facts\n\nKeep our project knowledge.\n");
  const settingsPath = path.join(root, ".claude/settings.json");
  const settings = JSON.parse(await readFile(settingsPath, "utf8"));
  settings.hooks.Stop.push({ hooks: [{ type: "command", command: "npm run security", timeout: 90 }] });
  await writeFile(settingsPath, stableJson(settings));
  const before = run(process.execPath, ["scripts/agent/check.mjs"], root);
  assert.equal(before.status, 0, before.stderr);
  assert.equal(JSON.parse(runCli(root, "doctor", "--json").stdout).ok, false);
  const updated = runCli(root, "update", "--yes", "--allow-dirty");
  assert.equal(updated.status, 0, updated.stderr);
  const records = await manifest(root);
  assert.equal(records.harnessVersion, HARNESS_VERSION);
  assert.equal(Object.keys(records.pending).length, 0);
  assert(records.files["scripts/agent/manifest-schema.mjs"]);
  assert(records.files["scripts/agent/stop-hook.mjs"]);
  assert.equal(await readFile(seedPath, "utf8"), "# Existing product facts\n\nKeep our project knowledge.\n");
  assert.match(await readFile(settingsPath, "utf8"), /npm run security/);
  assert.equal(runCli(root, "doctor").status, 0);
  const check = run(process.execPath, ["scripts/agent/check.mjs"], root);
  assert.equal(check.status, 0, check.stderr);
  const hook = await runHook(root, "codex", { hook_event_name: "Stop", stop_hook_active: false });
  assert.equal(hook.status, 0, hook.stderr);
  assert.deepEqual(JSON.parse(hook.stdout), {});
});

test("v0.1.0 modified managed files remain proposals until deliberately resolved", async (t) => {
  const root = await repository(t);
  await legacyInstall(root);
  const target = "docs/agent/evaluations/general.md";
  await writeFile(path.join(root, target), "# Custom project evaluator\n");
  const updated = runCli(root, "update", "--yes", "--allow-dirty");
  assert.equal(updated.status, 0, updated.stderr);
  assert.equal(await readFile(path.join(root, target), "utf8"), "# Custom project evaluator\n");
  const records = await manifest(root);
  assert.equal(records.pending[target].targetVersion, HARNESS_VERSION);
  assert.equal(runCli(root, "doctor").status, 1);
  const proposed = await readFile(path.join(root, records.pending[target].proposal), "utf8");
  await writeFile(path.join(root, target), proposed);
  assert.equal(runCli(root, "doctor").status, 0);
});
