#!/usr/bin/env node

import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const cache = mkdtempSync(path.join(os.tmpdir(), "agent-harness-npm-cache-"));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

try {
  const result = spawnSync(npm, ["pack", "--dry-run", "--json", "--cache", cache], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "npm pack failed");
  const report = JSON.parse(result.stdout)[0];
  const packaged = new Map(report.files.map((file) => [file.path, file]));
  const catalog = JSON.parse(readFileSync(path.join(root, "templates", "catalog.json"), "utf8"));
  const missing = catalog.files
    .map((entry) => entry.source)
    .filter((source) => !packaged.has(source));
  for (const required of ["bin/agent-harness.mjs", "package.json", "src/cli.mjs", "templates/catalog.json"]) {
    if (!packaged.has(required)) missing.push(required);
  }
  if (missing.length > 0) {
    throw new Error(`package is missing runtime files:\n${[...new Set(missing)].sort().join("\n")}`);
  }
  if (process.platform !== "win32" && (packaged.get("bin/agent-harness.mjs").mode & 0o111) === 0) {
    throw new Error("packaged CLI entrypoint is not executable");
  }
  console.log(`verify-package: ok (${report.entryCount} files, ${report.size} bytes)`);
} finally {
  rmSync(cache, { recursive: true, force: true });
}
