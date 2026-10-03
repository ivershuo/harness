import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, rm } from "node:fs/promises";
import { assertNoSymlink, readProjectFile, resolveTarget, stableJson } from "./fs-safe.mjs";

export const LOCK_PATH = ".agent-harness/write.lock";

export async function withWriteLock(root, callback) {
  await assertNoSymlink(root, ".agent-harness");
  await mkdir(resolveTarget(root, ".agent-harness"), { recursive: true });
  await assertNoSymlink(root, LOCK_PATH);
  const target = resolveTarget(root, LOCK_PATH);
  let handle;
  try {
    handle = await open(target, "wx", 0o600);
  } catch (error) {
    if (error.code === "EEXIST") throw new Error(`Harness write lock already exists at ${LOCK_PATH}; wait for the active command, or remove a stale lock after checking its owner`);
    throw error;
  }
  const token = randomUUID();
  const owned = await handle.stat();
  const lockContent = stableJson({ pid: process.pid, token, createdAt: new Date().toISOString() });
  try {
    await handle.writeFile(lockContent);
    await handle.close();
    handle = null;
    return await callback();
  } finally {
    if (handle) await handle.close().catch(() => {});
    try {
      const current = await lstat(target);
      if (!current.isSymbolicLink() && current.dev === owned.dev && current.ino === owned.ino && await readProjectFile(root, LOCK_PATH) === lockContent) {
        await rm(target);
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}
