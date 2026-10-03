#!/usr/bin/env node

import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const tests = readdirSync(path.join(root, "test"))
  .filter((name) => name.endsWith(".test.mjs"))
  .sort()
  .map((name) => path.join(root, "test", name));
const result = spawnSync(process.execPath, ["--test", ...tests], { cwd: root, stdio: "inherit" });
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
