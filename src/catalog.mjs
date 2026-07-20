import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(fileURLToPath(new URL("../", import.meta.url)));

export async function loadCatalog() {
  const catalogPath = path.join(packageRoot, "templates", "catalog.json");
  const parsed = JSON.parse(await readFile(catalogPath, "utf8"));
  if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.files)) {
    throw new Error("invalid template catalog");
  }
  return parsed.files;
}

export async function renderEntry(entry, variables) {
  const source = path.resolve(packageRoot, entry.source);
  const prefix = `${packageRoot}${path.sep}`;
  if (!source.startsWith(prefix)) throw new Error(`template escapes package root: ${entry.source}`);
  let content = await readFile(source, "utf8");
  for (const [key, value] of Object.entries(variables)) {
    content = content.replaceAll(`{{${key}}}`, value);
  }
  return content;
}

export function selectEntries(catalog, selection) {
  const modules = new Set(["base", ...selection.modules]);
  const tools = new Set(selection.tools);
  return catalog.filter((entry) => {
    if (entry.module === "github-ci") return selection.ci === "github";
    if (!modules.has(entry.module)) return false;
    if (entry.tool && !tools.has(entry.tool)) return false;
    return true;
  });
}
