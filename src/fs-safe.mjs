import { createHash, randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  rename,
  rm,
} from "node:fs/promises";
import path from "node:path";
import { validateRelativePath } from "../scripts/agent/manifest-schema.mjs";

const MAX_PROJECT_FILE_BYTES = 5 * 1024 * 1024;

export function hashContent(content) {
  const normalized = content.replace(/\r\n?/g, "\n");
  return createHash("sha256").update(normalized).digest("hex");
}

export function hashExactContent(content) {
  return content === null ? null : createHash("sha256").update(content).digest("hex");
}

export async function canonicalRoot(root) {
  return realpath(path.resolve(root));
}

export function resolveTarget(root, relativePath) {
  if (!relativePath || path.isAbsolute(relativePath)) {
    throw new Error(`invalid target path: ${relativePath}`);
  }
  const normalized = relativePath.split("/").join(path.sep);
  const target = path.resolve(root, normalized);
  const prefix = `${path.resolve(root)}${path.sep}`;
  if (target !== path.resolve(root) && !target.startsWith(prefix)) {
    throw new Error(`target escapes project root: ${relativePath}`);
  }
  validateRelativePath(relativePath);
  return target;
}

async function statOrNull(target) {
  try {
    return await lstat(target);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

export async function assertNoSymlink(root, relativePath) {
  resolveTarget(root, relativePath);
  const parts = relativePath.split("/").filter(Boolean);
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    const stat = await statOrNull(current);
    if (!stat) return;
    if (stat.isSymbolicLink()) {
      throw new Error(`refusing to follow symlink: ${relativePath}`);
    }
  }
}

export async function readProjectFile(root, relativePath) {
  await assertNoSymlink(root, relativePath);
  const target = resolveTarget(root, relativePath);
  const stat = await statOrNull(target);
  if (!stat) return null;
  if (!stat.isFile()) throw new Error(`target is not a file: ${relativePath}`);
  if (stat.size > MAX_PROJECT_FILE_BYTES) {
    throw new Error(`target exceeds 5 MiB safety limit: ${relativePath}`);
  }
  return readFile(target, "utf8");
}

export async function atomicWrite(root, relativePath, content, executable = false, expectedHash = undefined) {
  await assertNoSymlink(root, relativePath);
  const target = resolveTarget(root, relativePath);
  const parent = path.dirname(target);
  await mkdir(parent, { recursive: true });
  if (parent !== path.resolve(root)) await assertNoSymlink(root, path.relative(root, parent).split(path.sep).join("/"));

  const existing = await statOrNull(target);
  if (existing && !existing.isFile()) throw new Error(`target is not a file: ${relativePath}`);
  const originalMode = existing ? existing.mode & 0o777 : 0o644;
  const mode = executable ? originalMode | ((originalMode & 0o444) >> 2) : originalMode;

  const temporary = path.join(
    parent,
    `.${path.basename(target)}.agent-harness-${randomUUID()}`,
  );
  let handle;
  let created = false;
  try {
    handle = await open(temporary, "wx", mode);
    created = true;
    if (process.platform !== "win32") {
      const temporaryStat = await handle.stat();
      if (existing && (existing.uid !== temporaryStat.uid || existing.gid !== temporaryStat.gid)) {
        await handle.chown(existing.uid, existing.gid);
      }
      await handle.chmod(mode);
    }
    await handle.writeFile(content, "utf8");
    await handle.close();
    handle = null;
    await assertNoSymlink(root, relativePath);
    if (expectedHash !== undefined && hashExactContent(await readProjectFile(root, relativePath)) !== expectedHash) {
      throw new Error(`file changed since plan was created: ${relativePath}; rerun the command`);
    }
    await rename(temporary, target);
  } finally {
    if (handle) await handle.close().catch(() => {});
    if (created) await rm(temporary, { force: true }).catch(() => {});
  }
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
