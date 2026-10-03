import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const packageRoot = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
export const cli = path.join(packageRoot, "bin/agent-harness.mjs");

export function run(command, args, cwd, options = {}) {
  return spawnSync(command, args, { cwd, encoding: "utf8", ...options });
}

export async function repository(t, prefix = "agent-harness-regression-") {
  const root = await mkdtemp(path.join(os.tmpdir(), prefix));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const args of [
    ["init", "-q"], ["config", "user.name", "Harness Test"],
    ["config", "user.email", "harness@example.invalid"], ["config", "commit.gpgsign", "false"],
  ]) assert.equal(run("git", args, root).status, 0);
  return root;
}

export function runCli(root, ...args) {
  return run(process.execPath, [cli, ...args], root);
}

export function install(root, ...args) {
  const result = runCli(root, "init", "--yes", "--ci", "none", ...args);
  assert.equal(result.status, 0, result.stderr);
}

export async function manifest(root) {
  return JSON.parse(await readFile(path.join(root, ".agent-harness/manifest.json"), "utf8"));
}

export async function runHook(root, tool, input = {}, cwd = root) {
  const relative = tool === "codex" ? ".codex/hooks.json" : ".claude/settings.json";
  const config = JSON.parse(await readFile(path.join(root, relative), "utf8"));
  const command = config.hooks.Stop[0].hooks[0].command;
  return run(command, [], cwd, { shell: true, input: JSON.stringify(input), timeout: 15_000 });
}
