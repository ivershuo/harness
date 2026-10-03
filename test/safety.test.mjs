import assert from "node:assert/strict";
import { chmod, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { applyPlan, planHarness } from "../src/harness.mjs";
import { install, manifest, repository, runCli } from "./helpers.mjs";
import { LOCK_PATH, withWriteLock } from "../src/write-lock.mjs";

const selection = { tools: ["codex", "claude"], modules: [], ci: "none" };

test("custom hook commands, matcher groups, and handler options survive merging", async (t) => {
  const root = await repository(t);
  await mkdir(path.join(root, ".claude"));
  const customized = [
    { matcher: "project-custom", hooks: [{ type: "command", command: "node scripts/agent/check.mjs --only instructions && npm run security", timeout: 120 }] },
    { matcher: "retained", hooks: [{ type: "command", command: "node scripts/agent/check.mjs --only instructions", timeout: 120, async: true }] },
  ];
  await writeFile(path.join(root, ".claude/settings.json"), JSON.stringify({ hooks: { Stop: customized } }));
  install(root, "--modules", "none");
  const settings = JSON.parse(await readFile(path.join(root, ".claude/settings.json"), "utf8"));
  for (const group of customized) assert(settings.hooks.Stop.some((item) => JSON.stringify(item) === JSON.stringify(group)));
});

test("stale plans reject new seed files before writing any ordinary files", async (t) => {
  const root = await repository(t);
  const plan = await planHarness({ root, selection, command: "init", projectName: "test" });
  await writeFile(path.join(root, "AGENTS.md"), "# User content created during confirmation\n");
  await assert.rejects(applyPlan(root, plan), /changed.*plan|stale plan/i);
  assert.equal(await readFile(path.join(root, "AGENTS.md"), "utf8"), "# User content created during confirmation\n");
  await assert.rejects(stat(path.join(root, "docs/PRODUCT.md")), { code: "ENOENT" });
});

test("stale plans reject changed managed files and manifest records", async (t) => {
  const root = await repository(t);
  install(root, "--modules", "none");
  const plan = await planHarness({ root, selection, command: "update", projectName: "test" });
  const file = path.join(root, "docs/agent/evaluations/general.md");
  await writeFile(file, "# New user evaluation\n");
  await assert.rejects(applyPlan(root, plan), /changed.*plan|stale plan/i);
  assert.equal(await readFile(file, "utf8"), "# New user evaluation\n");
  const next = await planHarness({ root, selection, command: "update", projectName: "test" });
  const records = await manifest(root);
  records.updatedAt = "2026-10-03T01:00:00.000Z";
  await writeFile(path.join(root, ".agent-harness/manifest.json"), JSON.stringify(records));
  await assert.rejects(applyPlan(root, next), /changed.*plan|stale plan/i);
});

test("concurrent Harness writers cannot both apply the same initial plan", async (t) => {
  const root = await repository(t);
  const plan = await planHarness({ root, selection, command: "init", projectName: "test" });
  const results = await Promise.allSettled([applyPlan(root, plan), applyPlan(root, plan)]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.match(results.find((result) => result.status === "rejected").reason.message, /lock|changed.*plan|stale plan/i);
  assert.equal(runCli(root, "doctor").status, 0);
});

test("merged files preserve private POSIX permissions", { skip: process.platform === "win32" }, async (t) => {
  const root = await repository(t);
  await mkdir(path.join(root, ".claude"));
  const file = path.join(root, ".claude/settings.json");
  await writeFile(file, JSON.stringify({ env: { LOCAL_SETTING: "harmless-fixture" } }));
  await chmod(file, 0o600);
  install(root, "--modules", "none");
  assert.equal((await stat(file)).mode & 0o777, 0o600);
});

test("failed plans release their own lock and preserve pre-existing locks", async (t) => {
  const root = await repository(t);
  await assert.rejects(withWriteLock(root, async () => { throw new Error("planned failure"); }), /planned failure/);
  await assert.rejects(stat(path.join(root, LOCK_PATH)), { code: "ENOENT" });
  await writeFile(path.join(root, LOCK_PATH), "another writer\n");
  await assert.rejects(withWriteLock(root, async () => {}), /write lock already exists/);
  assert.equal(await readFile(path.join(root, LOCK_PATH), "utf8"), "another writer\n");
});
