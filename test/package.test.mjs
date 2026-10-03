import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { packageRoot, repository, run, runHook } from "./helpers.mjs";

test("packed tarball runs init, generated checks, doctor and nested Stop hooks", async (t) => {
  const output = await mkdtemp(path.join(os.tmpdir(), "harness-package-smoke-"));
  t.after(() => rm(output, { recursive: true, force: true }));
  const packArgs = ["pack", "--json", "--ignore-scripts", "--pack-destination", output, "--cache", path.join(output, "cache")];
  // npm.cmd needs shell handling on Windows; prefer the npm JS entrypoint.
  const npmEntry = process.env.npm_execpath;
  const packed = npmEntry
    ? run(process.execPath, [npmEntry, ...packArgs], packageRoot)
    : run(process.platform === "win32" ? "npm.cmd" : "npm", packArgs, packageRoot, { shell: process.platform === "win32" });
  assert.equal(packed.status, 0, packed.stderr);
  const tarball = path.join(output, JSON.parse(packed.stdout)[0].filename);
  const extract = run("tar", ["-xzf", tarball, "-C", output], output);
  assert.equal(extract.status, 0, extract.stderr);
  const cli = path.join(output, "package/bin/agent-harness.mjs");
  // Both adapter selection paths must work from the smaller, standalone package.
  for (const tools of [["codex", "claude"], ["claude"]]) {
    const root = await repository(t, "harness packed project ");
    const initArgs = [cli, "init", "--yes", "--ci", "none", "--tools", tools.join(",")];
    const init = run(process.execPath, initArgs, root);
    assert.equal(init.status, 0, init.stderr);
    const manifestPath = path.join(root, ".agent-harness/manifest.json");
    const before = await readFile(manifestPath, "utf8");
    const installed = JSON.parse(before);
    const skillPaths = Object.keys(installed.files).filter((target) => target.startsWith(".claude/skills/"));
    assert.equal(skillPaths.length, 6);
    for (const target of skillPaths) {
      // The package omits native Claude wrappers but installs their equivalent.
      await assert.rejects(readFile(path.join(output, "package", target)), { code: "ENOENT" });
      const canonical = await readFile(path.join(output, "package", target.replace(".claude/", ".agents/")), "utf8");
      const content = await readFile(path.join(root, target), "utf8");
      assert.match(content, /^---\ndisable-model-invocation: true\n/);
      assert.equal(content.replace("disable-model-invocation: true\n", ""), canonical);
    }
    const repeated = run(process.execPath, [...initArgs, "--allow-dirty"], root);
    assert.equal(repeated.status, 0, repeated.stderr);
    assert.equal(await readFile(manifestPath, "utf8"), before);
    const check = run(process.execPath, ["scripts/agent/check.mjs"], root);
    assert.equal(check.status, 0, check.stderr);
    const doctor = run(process.execPath, [cli, "doctor", "--json"], root);
    assert.equal(doctor.status, 0, doctor.stderr);
    assert.equal(JSON.parse(doctor.stdout).ok, true);
    const cwd = path.join(root, "nested folder");
    await mkdir(cwd);
    for (const tool of tools) {
      const hook = await runHook(root, tool, { hook_event_name: "Stop", stop_hook_active: false }, cwd);
      assert.equal(hook.status, 0, hook.stderr);
      assert.deepEqual(JSON.parse(hook.stdout), {});
    }
  }
});
