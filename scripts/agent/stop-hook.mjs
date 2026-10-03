#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolve from this installed script, never from user-controlled hook input.
const root = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const emit = (value) => process.stdout.write(`${JSON.stringify(value)}\n`);

try {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
    if (Buffer.byteLength(input) > 64 * 1024) throw new Error("oversized hook input");
  }
  const event = JSON.parse(input);
  if (!event || event.hook_event_name !== "Stop" || typeof event.stop_hook_active !== "boolean") {
    throw new Error("invalid Stop input");
  }
  const check = spawnSync(process.execPath, [path.join(root, "scripts/agent/check.mjs"), "--only", "instructions"], {
    cwd: root, encoding: "utf8", timeout: 20_000, maxBuffer: 64 * 1024,
  });
  if (check.status === 0) {
    emit({});
  } else {
    const reason = `Harness instruction check failed. Fix the reported requirements and run node scripts/agent/check.mjs --only instructions.\n${(check.stderr || "Check did not complete.").slice(0, 4000)}`;
    if (event.stop_hook_active) {
      emit({ systemMessage: "Harness instruction check is still failing after one continuation. Report the outstanding failure; automatic retries have stopped." });
    } else {
      emit({ decision: "block", reason });
    }
  }
} catch {
  // Do not echo malformed input, which can contain sensitive session data.
  emit({ systemMessage: "Harness Stop hook received invalid input. Run the instruction check manually." });
}
