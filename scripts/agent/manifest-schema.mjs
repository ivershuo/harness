// Shared by the packaged CLI and generated checks; no filesystem or CLI imports.
export const TOOLS = ["codex", "claude"];
export const MODULES = ["brain", "ui", "api"];
const FILE_MODULES = ["base", ...MODULES, "github-ci"];
const STATES = { seed: ["project-owned"], managed: ["managed", "conflict"], merged: ["merged", "conflict"] };
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isVersion = (value) => typeof value === "string" && /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(value);
const isHash = (value) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);

export function validateRelativePath(value) {
  if (typeof value !== "string" || !value || value.includes("\\") || value.includes("\0") || /^[A-Za-z]:/.test(value) || value.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error(`invalid relative path: ${value}`);
  }
}

export function validateSelection(selection) {
  const validList = (value, allowed) => Array.isArray(value) && value.every((item) => allowed.includes(item)) && new Set(value).size === value.length;
  if (!isObject(selection) || !validList(selection.tools, TOOLS) || selection.tools.length === 0 || !validList(selection.modules, MODULES) || !["github", "none"].includes(selection.ci)) {
    throw new Error("invalid selection");
  }
}

export function validateManifest(manifest) {
  if (!isObject(manifest) || manifest.schemaVersion !== 1) {
    throw new Error(`unsupported manifest schema: ${manifest?.schemaVersion}`);
  }
  validateSelection(manifest.selection);
  if (!isVersion(manifest.harnessVersion) || typeof manifest.source !== "string" || !manifest.source || ![manifest.installedAt, manifest.updatedAt].every((date) => typeof date === "string" && Number.isFinite(Date.parse(date)))) {
    throw new Error("invalid manifest metadata");
  }
  if (!isObject(manifest.files)) throw new Error("invalid files");
  if (!isObject(manifest.pending)) throw new Error("invalid pending proposals");
  for (const [target, record] of Object.entries(manifest.files)) {
    validateRelativePath(target);
    if (!isObject(record) || !Object.hasOwn(STATES, record.ownership) || !STATES[record.ownership].includes(record.state) || !FILE_MODULES.includes(record.module) || !isVersion(record.templateVersion) || !isHash(record.templateHash) || !(isHash(record.installedHash) || (record.ownership === "merged" && record.state === "conflict" && record.installedHash === null))) {
      throw new Error(`invalid file record: ${target}`);
    }
    if (record.state === "conflict" && !Object.hasOwn(manifest.pending, target)) {
      throw new Error(`conflict has no pending proposal: ${target}`);
    }
  }
  for (const [target, pending] of Object.entries(manifest.pending)) {
    validateRelativePath(target);
    if (!Object.hasOwn(manifest.files, target) || !isObject(pending) || !isVersion(pending.targetVersion) || typeof pending.reason !== "string" || !pending.reason.trim() || (pending.details !== undefined && (!Array.isArray(pending.details) || !pending.details.every((item) => typeof item === "string")))) {
      throw new Error(`invalid pending proposal: ${target}`);
    }
    validateRelativePath(pending.proposal);
    if (!pending.proposal.startsWith(`.agent-harness/proposals/${pending.targetVersion}/`)) {
      throw new Error(`invalid proposal path: ${target}`);
    }
  }
  return manifest;
}
