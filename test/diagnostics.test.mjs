import assert from "node:assert/strict";
import { mkdir, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { install, manifest, repository, run, runCli } from "./helpers.mjs";

async function mutateManifest(root, change) {
  const records = await manifest(root);
  change(records);
  await writeFile(path.join(root, ".agent-harness/manifest.json"), JSON.stringify(records));
}

test("doctor rejects unknown selections and invalid file or pending records as JSON", async (t) => {
  const root = await repository(t);
  install(root, "--modules", "none");
  const original = await manifest(root);
  for (const change of [
    (m) => { m.selection.tools = ["unknown"]; },
    (m) => { m.selection.modules = ["unknown"]; },
    (m) => { m.files["docs/agent/evaluations/general.md"].state = "corrupted-state"; },
    (m) => { m.files["docs/agent/evaluations/general.md"].ownership = "unknown"; },
    (m) => { m.files["docs/agent/evaluations/general.md"].installedHash = "invalid"; },
    (m) => { m.pending["AGENTS.md"] = null; },
    (m) => { m.pending["AGENTS.md"] = { proposal: "../outside", targetVersion: "0.1.0", reason: "modified" }; },
  ]) {
    await writeFile(path.join(root, ".agent-harness/manifest.json"), JSON.stringify(original));
    await mutateManifest(root, change);
    const result = runCli(root, "doctor", "--json");
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).ok, false);
  }
});

test("doctor never accepts illegal managed state after content drift", async (t) => {
  const root = await repository(t);
  install(root, "--modules", "none");
  await mutateManifest(root, (m) => { m.files["docs/agent/evaluations/general.md"].state = "corrupted-state"; });
  await writeFile(path.join(root, "docs/agent/evaluations/general.md"), "# Broken\n");
  assert.equal(JSON.parse(runCli(root, "doctor", "--json").stdout).ok, false);
});

test("generated checks fail when selected skills are missing", async (t) => {
  const root = await repository(t);
  install(root);
  await rm(path.join(root, ".agents/skills"), { recursive: true });
  const check = run(process.execPath, ["scripts/agent/check.mjs"], root);
  assert.equal(check.status, 1);
  assert.match(check.stderr, /skills/);
  assert.equal(runCli(root, "doctor").status, 1);
});

test("doctor and generated checks both reject symlinked brain pages", { skip: process.platform === "win32" }, async (t) => {
  const root = await repository(t);
  const outside = await repository(t);
  install(root);
  await writeFile(path.join(outside, "page.md"), "# External page\n");
  await symlink(path.join(outside, "page.md"), path.join(root, "brain/pages/external.md"));
  const doctor = runCli(root, "doctor", "--json");
  assert.equal(doctor.status, 1);
  assert.match(JSON.stringify(JSON.parse(doctor.stdout).issues), /symlink/);
  const check = run(process.execPath, ["scripts/agent/check.mjs", "--only", "brain"], root);
  assert.equal(check.status, 1);
  assert.match(check.stderr, /symlink/);
});

test("project detection rejects unsafe stack metadata", { skip: process.platform === "win32" }, async (t) => {
  const root = await repository(t);
  const outside = await repository(t);
  await writeFile(path.join(outside, "pyproject.toml"), "[tool.pytest]\n");
  await symlink(path.join(outside, "pyproject.toml"), path.join(root, "pyproject.toml"));
  const result = runCli(root, "init", "--yes", "--ci", "none");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /symlink/);
});

test("doctor and generated checks reject non-markdown brain symlinks", { skip: process.platform === "win32" }, async (t) => {
  const root = await repository(t);
  const outside = await repository(t);
  install(root);
  await symlink(outside, path.join(root, "brain/pages/non-markdown-link"));
  assert.equal(runCli(root, "doctor").status, 1);
  const check = run(process.execPath, ["scripts/agent/check.mjs", "--only", "brain"], root);
  assert.equal(check.status, 1);
  assert.match(check.stderr, /symlink/);
});
