import { readdir } from "node:fs/promises";
import { loadCatalog, renderEntry, selectEntries } from "./catalog.mjs";
import {
  atomicWrite,
  hashContent,
  readProjectFile,
  resolveTarget,
  stableJson,
} from "./fs-safe.mjs";
import {
  HARNESS_VERSION,
  MANIFEST_PATH,
  MANIFEST_SCHEMA_VERSION,
  SOURCE,
} from "./constants.mjs";

function markers(entry) {
  if (entry.markerStyle === "hash") {
    return ["# agent-harness:start", "# agent-harness:end"];
  }
  return ["<!-- agent-harness:start -->", "<!-- agent-harness:end -->"];
}

function mergeBlock(current, block, entry) {
  const [start, end] = markers(entry);
  const eol = current?.includes("\r\n") ? "\r\n" : "\n";
  const normalizedBlock = block.replace(/\r\n?/g, "\n").trimEnd().replaceAll("\n", eol);
  const replacement = `${start}${eol}${normalizedBlock}${eol}${end}`;
  if (current === null || current.trim().length === 0) return `${replacement}\n`;
  const startIndex = current.indexOf(start);
  const endIndex = current.indexOf(end);
  if ((startIndex === -1) !== (endIndex === -1) || endIndex < startIndex) {
    throw new Error("managed block markers are incomplete");
  }
  if (startIndex === -1) return `${current.trimEnd()}${eol}${eol}${replacement}${eol}`;
  if (current.indexOf(start, startIndex + start.length) !== -1 || current.indexOf(end, endIndex + end.length) !== -1) {
    throw new Error("managed block markers are duplicated");
  }
  const afterEnd = endIndex + end.length;
  return `${current.slice(0, startIndex)}${replacement}${current.slice(afterEnd)}`;
}

function itemKey(value) {
  return JSON.stringify(value);
}

function isHarnessCheckCommand(value) {
  if (typeof value !== "string") return false;
  return (
    value.includes("node scripts/agent/check.mjs") ||
    value.includes("scripts/agent/check-agent-instructions") ||
    value.includes("scripts/agent/check-docs") ||
    value.includes("scripts/agent/check-architecture") ||
    value.includes("scripts/agent/check-brain")
  );
}

function harnessArrayIdentity(value) {
  if (isHarnessCheckCommand(value)) {
    return "agent-harness-check-command";
  }
  if (
    value &&
    typeof value === "object" &&
    value.type === "command" &&
    typeof value.command === "string" &&
    isHarnessCheckCommand(value.command)
  ) {
    return "agent-harness-check-hook";
  }
  return null;
}

function containsHarnessArrayItem(value) {
  if (harnessArrayIdentity(value)) return true;
  if (Array.isArray(value)) return value.some(containsHarnessArrayItem);
  if (value && typeof value === "object") return Object.values(value).some(containsHarnessArrayItem);
  return false;
}

function stripHarnessArrayItems(value) {
  if (harnessArrayIdentity(value)) return undefined;
  if (Array.isArray(value)) {
    return value.map(stripHarnessArrayItems).filter((item) => item !== undefined);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, stripHarnessArrayItems(item)])
        .filter(([, item]) => item !== undefined),
    );
  }
  return value;
}

function containsNonEmptyArray(value) {
  if (Array.isArray(value)) return value.length > 0 || value.some(containsNonEmptyArray);
  if (value && typeof value === "object") return Object.values(value).some(containsNonEmptyArray);
  return false;
}

function mergeJsonValue(current, desired) {
  if (Array.isArray(desired)) {
    const source = Array.isArray(current) ? current : [];
    const merged = [...source];
    for (const item of desired) {
      const identity = harnessArrayIdentity(item);
      if (identity) {
        const indexes = merged
          .map((existing, index) => harnessArrayIdentity(existing) === identity ? index : -1)
          .filter((index) => index !== -1);
        if (indexes.length === 0) merged.push(item);
        else {
          merged[indexes[0]] = item;
          for (const index of indexes.slice(1).reverse()) merged.splice(index, 1);
        }
      } else if (containsHarnessArrayItem(item)) {
        const indexes = merged
          .map((existing, index) => containsHarnessArrayItem(existing) ? index : -1)
          .filter((index) => index !== -1);
        if (indexes.length === 0) merged.push(item);
        else {
          const first = indexes[0];
          const rebuilt = [];
          for (let index = 0; index < merged.length; index += 1) {
            if (index === first) rebuilt.push(item);
            if (!indexes.includes(index)) {
              rebuilt.push(merged[index]);
              continue;
            }
            const stripped = stripHarnessArrayItems(merged[index]);
            if (containsNonEmptyArray(stripped)) rebuilt.push(stripped);
          }
          merged.splice(0, merged.length, ...rebuilt);
        }
      } else if (!merged.some((existing) => itemKey(existing) === itemKey(item))) {
        merged.push(item);
      }
    }
    return { value: merged, conflict: current !== undefined && !Array.isArray(current) };
  }
  if (desired && typeof desired === "object") {
    const source = current && typeof current === "object" && !Array.isArray(current) ? current : {};
    const merged = { ...source };
    let conflict = current !== undefined && source !== current;
    for (const [key, value] of Object.entries(desired)) {
      const result = mergeJsonValue(source[key], value);
      merged[key] = result.value;
      conflict ||= result.conflict;
    }
    return { value: merged, conflict };
  }
  if (current === undefined || current === desired) return { value: desired, conflict: false };
  return { value: current, conflict: true };
}

function mergeJson(current, desiredText) {
  const desired = JSON.parse(desiredText);
  const existing = current === null || current.trim() === "" ? {} : JSON.parse(current);
  const result = mergeJsonValue(existing, desired);
  return { content: stableJson(result.value), conflict: result.conflict };
}

async function readManifest(root) {
  const content = await readProjectFile(root, MANIFEST_PATH);
  if (content === null) return null;
  let manifest;
  try {
    manifest = JSON.parse(content);
  } catch {
    throw new Error(`${MANIFEST_PATH} is not valid JSON`);
  }
  if (manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
    throw new Error(`unsupported manifest schema: ${manifest.schemaVersion}`);
  }
  if (
    !manifest.selection ||
    !Array.isArray(manifest.selection.tools) ||
    !manifest.selection.tools.every((item) => typeof item === "string") ||
    !Array.isArray(manifest.selection.modules) ||
    !manifest.selection.modules.every((item) => typeof item === "string") ||
    !["github", "none"].includes(manifest.selection.ci)
  ) {
    throw new Error(`${MANIFEST_PATH} has an invalid selection`);
  }
  if (!manifest.files || typeof manifest.files !== "object" || Array.isArray(manifest.files)) {
    throw new Error(`${MANIFEST_PATH} has invalid files`);
  }
  if (!manifest.pending || typeof manifest.pending !== "object" || Array.isArray(manifest.pending)) {
    throw new Error(`${MANIFEST_PATH} has invalid pending proposals`);
  }
  for (const target of [...Object.keys(manifest.files), ...Object.keys(manifest.pending)]) {
    resolveTarget(root, target);
  }
  return manifest;
}

function proposalPath(target) {
  return `.agent-harness/proposals/${HARNESS_VERSION}/${target}`;
}

function fileRecord(entry, templateHash, installedHash, state) {
  return {
    ownership: entry.ownership,
    module: entry.module,
    templateVersion: HARNESS_VERSION,
    templateHash,
    installedHash,
    state,
  };
}

function seedIssues(target, current, selection) {
  const issues = [];
  if (
    target === "AGENTS.md" ||
    target === "BRAIN.md" ||
    target.startsWith("docs/") ||
    target.startsWith("brain/")
  ) {
    if (current.trim() === "") issues.push("file must not be empty");
  }
  if (target === "AGENTS.md") {
    if (current.split(/\r?\n/).length > 150) issues.push("AGENTS.md must stay under 150 lines");
    for (const token of ["docs/SECURITY.md", "docs/PERFORMANCE.md", "node scripts/agent/check.mjs"]) {
      if (!current.includes(token)) issues.push(`missing ${token}`);
    }
    if (selection.modules.includes("brain") && !current.includes("BRAIN.md")) issues.push("missing BRAIN.md");
  }
  if (target === "docs/QUALITY.md") {
    if (!current.includes("Security")) issues.push("missing Security requirement");
    if (!current.includes("Performance")) issues.push("missing Performance requirement");
  }
  if (target === "docs/ARCHITECTURE.md") {
    for (const heading of ["## Boundaries", "## Public Interfaces", "## Change Rules"]) {
      if (!current.includes(heading)) issues.push(`missing ${heading}`);
    }
  }
  if (target === "BRAIN.md" && !current.includes("node scripts/agent/check.mjs --only brain")) {
    issues.push("missing brain check command");
  }
  if (target === "brain/index.md" && !current.includes("[[harness-adoption]]")) {
    issues.push("missing [[harness-adoption]] link");
  }
  if (target.startsWith("brain/pages/") && target.endsWith(".md")) {
    for (const key of ["id", "title", "category", "status", "created", "updated"]) {
      if (!new RegExp(`^${key}:\\s*.+$`, "m").test(current)) issues.push(`missing ${key}`);
    }
    if (!current.includes("## compiled_truth")) issues.push("missing compiled_truth");
    if (!current.includes("## timeline")) issues.push("missing timeline");
  }
  return issues;
}

function seedAdaptation(target, current, desired, selection) {
  if (current.trim() === "") return desired;
  const additions = [];
  if (target === "AGENTS.md") {
    const requirements = [
      ["docs/SECURITY.md", "- Security requirements: `docs/SECURITY.md`"],
      ["docs/PERFORMANCE.md", "- Performance budgets: `docs/PERFORMANCE.md`"],
      ["node scripts/agent/check.mjs", "- Required gate: `node scripts/agent/check.mjs`"],
    ];
    if (selection.modules.includes("brain")) {
      requirements.push(["BRAIN.md", "- Durable decisions: `BRAIN.md` and `brain/`"]);
    }
    for (const [token, line] of requirements) if (!current.includes(token)) additions.push(line);
    if (additions.length > 0) {
      return `${current.trimEnd()}\n\n## Agent Harness Integration\n\n${additions.join("\n")}\n`;
    }
  }
  if (target === "docs/QUALITY.md") {
    if (!current.includes("Security") || !current.includes("Performance")) {
      return `${current.trimEnd()}\n\n## Agent Harness Requirements\n\nSecurity and Performance requirements are part of the quality gate.\n`;
    }
  }
  if (target === "docs/ARCHITECTURE.md") {
    for (const heading of ["## Boundaries", "## Public Interfaces", "## Change Rules"]) {
      if (!current.includes(heading)) additions.push(`${heading}\n\nDocument project-specific constraints here.`);
    }
    if (additions.length > 0) return `${current.trimEnd()}\n\n${additions.join("\n\n")}\n`;
  }
  if (target === "BRAIN.md" && !current.includes("node scripts/agent/check.mjs --only brain")) {
    return `${current.trimEnd()}\n\nRun \`node scripts/agent/check.mjs --only brain\` after brain changes.\n`;
  }
  if (target === "brain/index.md" && !current.includes("[[harness-adoption]]")) {
    return `${current.trimEnd()}\n\n- [[harness-adoption]]: why this project adopted Agent Harness\n`;
  }
  return null;
}

function mergeReport(target, reason, desired) {
  return [
    `# Merge Required: ${target}`,
    "",
    `Reason: ${reason}`,
    "",
    `The existing file at \`${target}\` was preserved. Do not replace it with this report.`,
    "Merge the required Harness content below into the existing file deliberately:",
    "",
    "```text",
    desired.trimEnd(),
    "```",
    "",
  ].join("\n");
}

async function addWrite(operations, root, target, content, executable, reason) {
  const current = await readProjectFile(root, target);
  if (current === content) return false;
  operations.push({ kind: "write", target, content, executable, reason });
  return true;
}

async function addProposal(operations, root, target, content, reason) {
  const proposal = proposalPath(target);
  await addWrite(operations, root, proposal, content, false, reason);
  return proposal;
}

export async function planHarness({ root, selection, command, projectName, qualityCommands = [] }) {
  const previous = await readManifest(root);
  if (command === "update" && !previous) {
    throw new Error("project is not initialized; run agent-harness init first");
  }

  const catalog = await loadCatalog();
  const entries = selectEntries(catalog, selection);
  const now = new Date().toISOString();
  const variables = {
    PROJECT_NAME: projectName,
    DATE: now.slice(0, 10),
    CHECK_COMMAND: "node scripts/agent/check.mjs",
    PROJECT_GATES: qualityCommands.length > 0
      ? qualityCommands.map((item) => `- \`${item}\``).join("\n")
      : "- Add the project's lint, typecheck, test, build, and security commands here.",
  };
  const operations = [];
  const actions = [];
  const files = { ...(previous?.files ?? {}) };
  const pending = { ...(previous?.pending ?? {}) };

  for (const entry of entries) {
    const desired = await renderEntry(entry, variables);
    const templateHash = hashContent(desired);
    const current = await readProjectFile(root, entry.target);
    const currentHash = current === null ? null : hashContent(current);
    const prior = files[entry.target];

    if (entry.ownership === "seed") {
      if (current === null) {
        await addWrite(operations, root, entry.target, desired, entry.executable, "install seed");
        actions.push({ action: "create", path: entry.target, ownership: "seed" });
        files[entry.target] = fileRecord(entry, templateHash, templateHash, "project-owned");
        delete pending[entry.target];
      } else {
        const issues = seedIssues(entry.target, current, selection);
        if (issues.length > 0) {
          const adaptation = seedAdaptation(entry.target, current, desired, selection);
          const safeCandidate = adaptation && seedIssues(entry.target, adaptation, selection).length === 0;
          const proposalTarget = safeCandidate ? entry.target : `${entry.target}.merge.md`;
          const proposalContent = safeCandidate
            ? adaptation
            : mergeReport(entry.target, issues.join("; "), desired);
          const proposal = await addProposal(operations, root, proposalTarget, proposalContent, "seed file needs adaptation");
          actions.push({ action: "proposal", path: entry.target, ownership: "seed" });
          pending[entry.target] = {
            proposal,
            targetVersion: HARNESS_VERSION,
            reason: "seed-adaptation",
            details: issues,
          };
        } else {
          actions.push({ action: "preserve", path: entry.target, ownership: "seed" });
          delete pending[entry.target];
        }
        files[entry.target] = fileRecord(entry, templateHash, currentHash, "project-owned");
      }
      continue;
    }

    if (entry.ownership === "managed") {
      if (currentHash === templateHash) {
        actions.push({ action: "current", path: entry.target, ownership: "managed" });
        files[entry.target] = fileRecord(entry, templateHash, templateHash, "managed");
        delete pending[entry.target];
      } else if (current === null) {
        if (!prior) {
          await addWrite(operations, root, entry.target, desired, entry.executable, "install managed file");
          actions.push({ action: "create", path: entry.target, ownership: "managed" });
          files[entry.target] = fileRecord(entry, templateHash, templateHash, "managed");
          delete pending[entry.target];
        } else {
          const proposal = await addProposal(operations, root, entry.target, desired, "restore missing managed file");
          actions.push({ action: "proposal", path: entry.target, ownership: "managed" });
          files[entry.target] = fileRecord(entry, templateHash, prior.installedHash, "conflict");
          pending[entry.target] = { proposal, targetVersion: HARNESS_VERSION, reason: "missing" };
        }
      } else if (prior?.state === "managed" && currentHash === prior.installedHash) {
        await addWrite(operations, root, entry.target, desired, entry.executable, "update managed file");
        actions.push({ action: "update", path: entry.target, ownership: "managed" });
        files[entry.target] = fileRecord(entry, templateHash, templateHash, "managed");
        delete pending[entry.target];
      } else {
        const proposal = await addProposal(operations, root, entry.target, desired, "managed file differs");
        actions.push({ action: "proposal", path: entry.target, ownership: "managed" });
        files[entry.target] = fileRecord(entry, templateHash, prior?.installedHash ?? currentHash, "conflict");
        pending[entry.target] = { proposal, targetVersion: HARNESS_VERSION, reason: "modified" };
      }
      continue;
    }

    if (entry.ownership === "merged") {
      try {
        const merged = entry.merge === "json"
          ? mergeJson(current, desired)
          : { content: mergeBlock(current, desired, entry), conflict: false };
        if (merged.conflict) throw new Error("existing scalar conflicts with required JSON value");
        const mergedHash = hashContent(merged.content);
        if (currentHash !== mergedHash) {
          await addWrite(operations, root, entry.target, merged.content, entry.executable, "merge harness settings");
          actions.push({ action: current === null ? "create" : "merge", path: entry.target, ownership: "merged" });
        } else {
          actions.push({ action: "current", path: entry.target, ownership: "merged" });
        }
        files[entry.target] = fileRecord(entry, templateHash, mergedHash, "merged");
        delete pending[entry.target];
      } catch (error) {
        const report = mergeReport(entry.target, error.message, desired);
        const proposal = await addProposal(
          operations,
          root,
          `${entry.target}.merge.md`,
          report,
          `merge conflict: ${error.message}`,
        );
        actions.push({ action: "proposal", path: entry.target, ownership: "merged" });
        files[entry.target] = fileRecord(entry, templateHash, currentHash, "conflict");
        pending[entry.target] = { proposal, targetVersion: HARNESS_VERSION, reason: error.message };
      }
      continue;
    }

    throw new Error(`unknown ownership mode: ${entry.ownership}`);
  }

  const installedAt = previous?.installedAt ?? now;
  let manifest = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    harnessVersion: HARNESS_VERSION,
    source: SOURCE,
    installedAt,
    updatedAt: previous?.updatedAt ?? now,
    selection,
    files,
    pending,
  };
  const previousText = previous ? stableJson(previous) : null;
  let manifestText = stableJson(manifest);
  if (manifestText !== previousText) {
    manifest = { ...manifest, updatedAt: now };
    manifestText = stableJson(manifest);
    operations.push({
      kind: "manifest",
      target: MANIFEST_PATH,
      content: manifestText,
      executable: false,
      reason: previous ? "update manifest" : "create manifest",
    });
  }

  return { operations, actions, manifest };
}

export async function applyPlan(root, plan) {
  const ordinary = plan.operations.filter((operation) => operation.kind !== "manifest");
  const manifests = plan.operations.filter((operation) => operation.kind === "manifest");
  for (const operation of [...ordinary, ...manifests]) {
    await atomicWrite(root, operation.target, operation.content, operation.executable);
  }
}

export async function doctorHarness(root) {
  const issues = [];
  let manifest;
  try {
    manifest = await readManifest(root);
  } catch (error) {
    return { ok: false, version: null, issues: [{ severity: "error", message: error.message }], files: {} };
  }
  if (!manifest) {
    return {
      ok: false,
      version: null,
      issues: [{ severity: "error", message: `missing ${MANIFEST_PATH}` }],
      files: {},
    };
  }

  const catalog = await loadCatalog();
  const selectedEntries = selectEntries(catalog, manifest.selection);
  const entryByTarget = new Map(selectedEntries.map((entry) => [entry.target, entry]));
  for (const entry of selectedEntries) {
    if (!manifest.files?.[entry.target]) {
      issues.push({ severity: "error", path: entry.target, message: "selected catalog file is not tracked" });
    }
  }
  if (manifest.harnessVersion !== HARNESS_VERSION) {
    issues.push({
      severity: "error",
      message: `installed harness v${manifest.harnessVersion} differs from current v${HARNESS_VERSION}; run update`,
    });
  }

  const files = {};
  const resolvedPending = new Set();
  for (const [target, record] of Object.entries(manifest.files ?? {})) {
    try {
      const content = await readProjectFile(root, target);
      if (content === null) {
        files[target] = "missing";
        issues.push({ severity: "error", path: target, message: "tracked file is missing" });
        continue;
      }
      const currentHash = hashContent(content);
      const entry = entryByTarget.get(target);
      if (entry && record.ownership !== "seed") {
        const desired = await renderEntry(entry, {
          PROJECT_NAME: "",
          DATE: "",
          CHECK_COMMAND: "",
          PROJECT_GATES: "",
        });
        if (record.templateVersion !== HARNESS_VERSION || record.templateHash !== hashContent(desired)) {
          files[target] = "outdated";
          issues.push({ severity: "error", path: target, message: "template metadata is outdated; run update" });
          continue;
        }
      }
      if (record.ownership === "seed") {
        const adaptationIssues = seedIssues(target, content, manifest.selection);
        if (adaptationIssues.length > 0) {
          files[target] = "needs-adaptation";
          issues.push({
            severity: "error",
            path: target,
            message: `project-owned seed file needs Harness adaptation: ${adaptationIssues.join("; ")}`,
          });
        } else {
          files[target] = record.state;
          resolvedPending.add(target);
        }
      } else if (record.ownership === "managed" && record.state === "managed" && currentHash !== record.installedHash) {
        files[target] = "modified";
        issues.push({ severity: "error", path: target, message: "managed file was modified" });
      } else if (record.ownership === "merged" && entryByTarget.has(target)) {
        const desired = await renderEntry(entry, {
          PROJECT_NAME: "",
          DATE: "",
          CHECK_COMMAND: "",
          PROJECT_GATES: "",
        });
        try {
          if (entry.merge === "json") {
            const merged = mergeJson(content, desired);
            if (merged.conflict || merged.content !== stableJson(JSON.parse(content))) {
              throw new Error("required JSON settings are missing or conflicting");
            }
          } else if (mergeBlock(content, desired, entry) !== content) {
            throw new Error("managed block is missing or modified");
          }
          files[target] = record.state;
          resolvedPending.add(target);
        } catch (error) {
          files[target] = "modified";
          issues.push({ severity: "error", path: target, message: error.message });
        }
      } else {
        files[target] = record.state;
        if (record.ownership === "managed" && currentHash === record.templateHash) resolvedPending.add(target);
      }
    } catch (error) {
      files[target] = "invalid";
      issues.push({ severity: "error", path: target, message: error.message });
    }
  }

  if (manifest.selection.modules.includes("brain")) {
    try {
      const index = (await readProjectFile(root, "brain/index.md")) ?? "";
      const pages = await readdir(resolveTarget(root, "brain/pages"), { withFileTypes: true });
      for (const page of pages.filter((entry) => entry.isFile() && entry.name.endsWith(".md"))) {
        const relative = `brain/pages/${page.name}`;
        const content = (await readProjectFile(root, relative)) ?? "";
        if (!manifest.files[relative]) {
          for (const issue of seedIssues(relative, content, manifest.selection)) {
            issues.push({ severity: "error", path: relative, message: issue });
          }
        }
        const id = content.match(/^id:\s*['"]?([^'"\r\n]+)['"]?\s*$/m)?.[1];
        if (id && !index.includes(`[[${id}]]`)) {
          issues.push({ severity: "error", path: "brain/index.md", message: `missing [[${id}]] link` });
        }
      }
    } catch (error) {
      issues.push({ severity: "error", path: "brain/", message: error.message });
    }
  }

  for (const [target, pending] of Object.entries(manifest.pending ?? {})) {
    if (resolvedPending.has(target)) continue;
    issues.push({
      severity: "error",
      path: target,
      message: `pending ${pending.reason} proposal at ${pending.proposal}`,
    });
  }

  return { ok: issues.length === 0, version: manifest.harnessVersion, issues, files };
}

export async function readRawManifest(root) {
  return readManifest(root);
}
