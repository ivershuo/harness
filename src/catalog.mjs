import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { STOP_HOOK_COMMAND } from "./constants.mjs";

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
  let content = adaptTemplate(await readFile(source, "utf8"), entry.adapter);
  const substitutions = { STOP_HOOK_COMMAND: JSON.stringify(STOP_HOOK_COMMAND).slice(1, -1), ...variables };
  for (const [key, value] of Object.entries(substitutions)) {
    content = content.replaceAll(`{{${key}}}`, value);
  }
  return content;
}

export function adaptTemplate(content, adapter) {
  if (adapter === undefined) return content;
  if (adapter !== "claude-skill") throw new Error(`unknown template adapter: ${adapter}`);
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) throw new Error("missing explicit skill frontmatter");
  if (/^[ \t]*(?:disable-model-invocation|"disable-model-invocation"|'disable-model-invocation')[ \t]*:/m.test(frontmatter[1])) {
    throw new Error("conflicting skill invocation metadata");
  }
  // These canonical wrappers have exactly two flat fields. Reject broader YAML
  // syntax instead of implementing a partial parser that can miss policy keys.
  const fields = frontmatter[1].split(/\r?\n/).map((line) => line.match(/^(name|description):[ \t]+\S.*$/)?.[1]);
  if (fields.length !== 2 || new Set(fields).size !== 2 || fields.includes(undefined)) {
    throw new Error("skill frontmatter must contain only flat name and description fields");
  }
  return content.replace(/^---(\r?\n)/, "---$1disable-model-invocation: true$1");
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
