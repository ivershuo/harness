import { createHash } from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const MAX_PROJECT_FILE_BYTES = 5 * 1024 * 1024;

export function hashContent(content) {
  const normalized = content.replace(/\r\n?/g, "\n");
  return createHash("sha256").update(normalized).digest("hex");
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

export async function atomicWrite(root, relativePath, content, executable = false) {
  await assertNoSymlink(root, relativePath);
  const target = resolveTarget(root, relativePath);
  const parent = path.dirname(target);
  await mkdir(parent, { recursive: true });
  await assertNoSymlink(root, path.relative(root, parent).split(path.sep).join("/"));

  const temporary = path.join(
    parent,
    `.${path.basename(target)}.agent-harness-${process.pid}-${Date.now()}`,
  );
  try {
    await writeFile(temporary, content, { encoding: "utf8", mode: executable ? 0o755 : 0o644 });
    await rename(temporary, target);
    if (executable && process.platform !== "win32") await chmod(target, 0o755);
  } finally {
    await rm(temporary, { force: true }).catch(() => {});
  }
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
