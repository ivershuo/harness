import { readProjectFile, resolveTarget } from "./fs-safe.mjs";
import { MANIFEST_PATH } from "./constants.mjs";
import { validateManifest } from "../scripts/agent/manifest-schema.mjs";

export async function readManifest(root, read = readProjectFile) {
  const content = await read(root, MANIFEST_PATH);
  if (content === null) return null;
  let manifest;
  try {
    manifest = JSON.parse(content);
  } catch {
    throw new Error(`${MANIFEST_PATH} is not valid JSON`);
  }
  try {
    validateManifest(manifest);
    for (const target of Object.keys(manifest.files)) resolveTarget(root, target);
  } catch (error) {
    throw new Error(`${MANIFEST_PATH} has an ${error.message}`);
  }
  return manifest;
}
