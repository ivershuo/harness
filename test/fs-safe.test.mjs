import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { resolveTarget } from "../src/fs-safe.mjs";

test("resolveTarget confines paths to the project root", () => {
  const root = path.resolve(path.sep, "tmp", "agent-harness-root");
  assert.equal(resolveTarget(root, "docs/PRODUCT.md"), path.join(root, "docs", "PRODUCT.md"));
  assert.throws(() => resolveTarget(root, "../outside"), /escapes project root/);
  assert.throws(() => resolveTarget(root, path.resolve(root, "absolute")), /invalid target path/);
});
