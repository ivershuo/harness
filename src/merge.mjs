import { stableJson } from "./fs-safe.mjs";
import { STOP_HOOK_COMMAND } from "./constants.mjs";

function markers(entry) {
  return entry.markerStyle === "hash"
    ? ["# agent-harness:start", "# agent-harness:end"]
    : ["<!-- agent-harness:start -->", "<!-- agent-harness:end -->"];
}

export function mergeBlock(current, block, entry) {
  const [start, end] = markers(entry);
  const eol = current?.includes("\r\n") ? "\r\n" : "\n";
  const normalizedBlock = block.replace(/\r\n?/g, "\n").trimEnd().replaceAll("\n", eol);
  const replacement = `${start}${eol}${normalizedBlock}${eol}${end}`;
  if (current === null || current.trim().length === 0) return `${replacement}${eol}`;
  const startIndex = current.indexOf(start);
  const endIndex = current.indexOf(end);
  if ((startIndex === -1) !== (endIndex === -1) || endIndex < startIndex) throw new Error("managed block markers are incomplete");
  if (startIndex === -1) return `${current.trimEnd()}${eol}${eol}${replacement}${eol}`;
  if (current.indexOf(start, startIndex + start.length) !== -1 || current.indexOf(end, endIndex + end.length) !== -1) throw new Error("managed block markers are duplicated");
  return `${current.slice(0, startIndex)}${replacement}${current.slice(endIndex + end.length)}`;
}

// Match published defaults, never a substring, wrapper, permission, or shell chain.
const LEGACY_COMMANDS = new Set([
  "node scripts/agent/check.mjs --only instructions",
  "scripts/agent/check-agent-instructions",
  "scripts/agent/check-docs",
  "scripts/agent/check-architecture",
  "scripts/agent/check-brain",
]);

function ownedHook(value) {
  return value && typeof value === "object" && value.type === "command"
    && (LEGACY_COMMANDS.has(value.command) || value.command === STOP_HOOK_COMMAND)
    && Object.keys(value).every((key) => ["type", "command", "timeout", "statusMessage"].includes(key))
    && (value.timeout === undefined || value.timeout === 30)
    && (value.statusMessage === undefined || ["Checking agent instruction hygiene", "Checking agent harness"].includes(value.statusMessage));
}

function mergeArray(current, desired) {
  let merged = Array.isArray(current) ? [...current] : [];
  for (const item of desired) {
    if (item && typeof item === "object" && Array.isArray(item.hooks) && item.hooks.length === 1 && ownedHook(item.hooks[0])) {
      let migrated = false;
      merged = merged.map((group) => {
        if (!group || !Array.isArray(group.hooks) || !group.hooks.some(ownedHook)) return group;
        migrated = true;
        let replaced = false;
        const hooks = group.hooks.flatMap((hook) => {
          if (!ownedHook(hook)) return [hook];
          if (replaced) return [];
          replaced = true;
          return [{ ...hook, ...item.hooks[0] }];
        });
        // Group-level matcher and policy fields stay with their original hooks.
        return { ...group, hooks };
      });
      if (!migrated) merged.push(item);
    } else if (!merged.some((existing) => JSON.stringify(existing) === JSON.stringify(item))) {
      merged.push(item);
    }
  }
  return { value: merged, conflict: current !== undefined && !Array.isArray(current) };
}

function mergeJsonValue(current, desired) {
  if (Array.isArray(desired)) return mergeArray(current, desired);
  if (desired && typeof desired === "object") {
    const source = current && typeof current === "object" && !Array.isArray(current) ? current : {};
    const merged = { ...source };
    let conflict = current !== undefined && source !== current;
    for (const [key, value] of Object.entries(desired)) {
      const result = mergeJsonValue(Object.hasOwn(source, key) ? source[key] : undefined, value);
      merged[key] = result.value;
      conflict ||= result.conflict;
    }
    return { value: merged, conflict };
  }
  if (current === undefined || current === desired) return { value: desired, conflict: false };
  return { value: current, conflict: true };
}

export function mergeJson(current, desiredText) {
  const existing = current === null || current.trim() === "" ? {} : JSON.parse(current);
  const result = mergeJsonValue(existing, JSON.parse(desiredText));
  return { content: stableJson(result.value), conflict: result.conflict };
}
