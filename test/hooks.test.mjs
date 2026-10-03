import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { install, repository, run, runHook } from "./helpers.mjs";

for (const tool of ["codex", "claude"]) {
  test(`${tool} Stop hook emits JSON and checks from subdirectories with spaces`, async (t) => {
    const root = await repository(t, "harness hook space ");
    install(root, "--tools", tool, "--modules", "none");
    const cwd = path.join(root, "nested directory");
    await mkdir(cwd);
    const result = await runHook(root, tool, { hook_event_name: "Stop", cwd, stop_hook_active: false }, cwd);
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.notEqual(output.decision, "block");
  });

  test(`${tool} Stop hook requests one repair and avoids endless continuation`, async (t) => {
    const root = await repository(t);
    install(root, "--tools", tool, "--modules", "none");
    await writeFile(path.join(root, "AGENTS.md"), "# Missing requirements\n");
    const first = await runHook(root, tool, { hook_event_name: "Stop", cwd: root, stop_hook_active: false });
    assert.equal(first.status, 0, first.stderr);
    assert.equal(JSON.parse(first.stdout).decision, "block");
    assert.match(JSON.parse(first.stdout).reason, /instructions/);
    const repeated = await runHook(root, tool, { hook_event_name: "Stop", cwd: root, stop_hook_active: true });
    assert.equal(repeated.status, 0, repeated.stderr);
    assert.notEqual(JSON.parse(repeated.stdout).decision, "block");
    assert.match(JSON.parse(repeated.stdout).systemMessage, /still failing/i);
  });
}

test("missing Stop adapter reports an error without endless blocking", async (t) => {
  const root = await repository(t);
  install(root, "--tools", "codex", "--modules", "none");
  await rm(path.join(root, "scripts/agent/stop-hook.mjs"));
  const result = await runHook(root, "codex", { hook_event_name: "Stop", stop_hook_active: true });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.notEqual(output.decision, "block");
  assert.match(output.systemMessage, /unavailable/i);
  assert.equal(run(process.execPath, ["scripts/agent/check.mjs"], root).status, 1);
});

test("oversized and malformed hook input warns without repeated blocking", async (t) => {
  const root = await repository(t);
  install(root, "--tools", "codex", "--modules", "none");
  for (const stop_hook_active of [false, true]) {
    const result = await runHook(root, "codex", {
      hook_event_name: "Stop", stop_hook_active, last_assistant_message: "x".repeat(66 * 1024),
    });
    assert.equal(result.status, 0, result.stderr);
    assert.notEqual(JSON.parse(result.stdout).decision, "block");
    assert.match(JSON.parse(result.stdout).systemMessage, /invalid input/);
  }
  const malformed = run(process.execPath, ["scripts/agent/stop-hook.mjs"], root, { input: "not JSON" });
  assert.equal(malformed.status, 0, malformed.stderr);
  assert.match(JSON.parse(malformed.stdout).systemMessage, /invalid input/);
});
