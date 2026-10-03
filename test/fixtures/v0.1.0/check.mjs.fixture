#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
let selectionCache;

function fail(scope, message) {
  failures.push(`${scope}: ${message}`);
}

function target(relativePath) {
  return path.join(root, ...relativePath.split("/"));
}

function exists(relativePath) {
  return existsSync(target(relativePath));
}

function text(relativePath) {
  try {
    return readFileSync(target(relativePath), "utf8");
  } catch {
    return null;
  }
}

function requireFile(scope, relativePath) {
  const content = text(relativePath);
  if (content === null || content.trim() === "") {
    fail(scope, `missing or empty ${relativePath}`);
    return "";
  }
  return content;
}

function requireIncludes(scope, relativePath, pattern, message) {
  const content = requireFile(scope, relativePath);
  if (content && !content.includes(pattern)) fail(scope, message);
}

function childDirectories(relativePath) {
  if (!exists(relativePath)) return [];
  return readdirSync(target(relativePath))
    .filter((name) => statSync(path.join(target(relativePath), name)).isDirectory())
    .sort();
}

function installedSelection() {
  if (selectionCache !== undefined) return selectionCache;
  const content = text(".agent-harness/manifest.json");
  if (content === null) {
    selectionCache = null;
    return selectionCache;
  }
  try {
    const manifest = JSON.parse(content);
    if (
      !Array.isArray(manifest.selection?.tools) ||
      !Array.isArray(manifest.selection?.modules) ||
      !["github", "none"].includes(manifest.selection?.ci)
    ) {
      throw new Error("invalid selection");
    }
    selectionCache = manifest.selection;
  } catch (error) {
    fail("manifest", `.agent-harness/manifest.json is invalid: ${error.message}`);
    selectionCache = null;
  }
  return selectionCache;
}

function toolEnabled(tool) {
  const selection = installedSelection();
  if (selection) return selection.tools.includes(tool);
  return tool === "codex" ? exists(".agents/skills") : exists("CLAUDE.md") || exists(".claude");
}

function moduleEnabled(module) {
  const selection = installedSelection();
  if (selection) return selection.modules.includes(module);
  if (module === "brain") return exists("BRAIN.md");
  if (module === "ui") return exists(".claude/rules/frontend/ui.md");
  if (module === "api") return exists(".claude/rules/api/api.md");
  return false;
}

function checkInstructions() {
  const scope = "instructions";
  const agents = requireFile(scope, "AGENTS.md");
  if (agents && agents.split(/\r?\n/).length > 150) fail(scope, "AGENTS.md must stay under 150 lines");
  requireIncludes(scope, "AGENTS.md", "docs/SECURITY.md", "AGENTS.md must link security docs");
  requireIncludes(scope, "AGENTS.md", "docs/PERFORMANCE.md", "AGENTS.md must link performance docs");

  if (toolEnabled("claude")) requireIncludes(scope, "CLAUDE.md", "@AGENTS.md", "CLAUDE.md must import AGENTS.md");
  if (moduleEnabled("brain")) requireIncludes(scope, "AGENTS.md", "BRAIN.md", "AGENTS.md must link the project brain");

  const codexSkills = toolEnabled("codex") ? childDirectories(".agents/skills") : [];
  const claudeSkills = toolEnabled("claude") ? childDirectories(".claude/skills") : [];
  for (const skill of codexSkills) requireFile(scope, `.agents/skills/${skill}/SKILL.md`);
  for (const skill of claudeSkills) requireFile(scope, `.claude/skills/${skill}/SKILL.md`);
  if (codexSkills.length > 0 && claudeSkills.length > 0) {
    const codexSet = codexSkills.join("\n");
    const claudeSet = claudeSkills.join("\n");
    if (codexSet !== claudeSet) fail(scope, "Codex and Claude skill names must stay in parity");
  }

  if (toolEnabled("claude")) {
    for (const agent of [
      "planner",
      "implementer",
      "evaluator",
      "code-reviewer",
      "security-reviewer",
      "test-runner",
      "debugger",
    ]) {
      requireFile(scope, `.claude/agents/${agent}.md`);
    }
  }
}

function checkDocs() {
  const scope = "docs";
  for (const file of [
    "docs/ARCHITECTURE.md",
    "docs/PRODUCT.md",
    "docs/QUALITY.md",
    "docs/SECURITY.md",
    "docs/PERFORMANCE.md",
    "docs/OPERATIONS.md",
    "docs/agent/index.md",
  ]) requireFile(scope, file);

  for (const workflow of ["feature-plan", "bug-repro", "pr-review", "security-review", "doc-gardener"]) {
    requireFile(scope, `docs/agent/workflows/${workflow}.md`);
  }
  if (moduleEnabled("brain")) requireFile(scope, "docs/agent/workflows/brain-ingest.md");
  for (const evaluation of ["general", "security"]) {
    requireFile(scope, `docs/agent/evaluations/${evaluation}.md`);
  }
  if (moduleEnabled("ui")) requireFile(scope, "docs/agent/evaluations/ui.md");
  if (moduleEnabled("api")) requireFile(scope, "docs/agent/evaluations/api.md");
  requireIncludes(scope, "docs/QUALITY.md", "Security", "quality docs should mention Security");
  requireIncludes(scope, "docs/QUALITY.md", "Performance", "quality docs should mention Performance");
}

function checkArchitecture() {
  const scope = "architecture";
  for (const heading of ["## Boundaries", "## Public Interfaces", "## Change Rules"]) {
    requireIncludes(scope, "docs/ARCHITECTURE.md", heading, `ARCHITECTURE.md needs ${heading.slice(3)} section`);
  }
}

function frontmatterValue(content, key) {
  return content.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1]?.replace(/^['"]|['"]$/g, "");
}

function checkBrain() {
  const scope = "brain";
  if (!moduleEnabled("brain")) return;
  requireIncludes(scope, "BRAIN.md", "node scripts/agent/check.mjs --only brain", "BRAIN.md must document the brain check");
  const index = requireFile(scope, "brain/index.md");
  for (const file of ["background", "architecture", "flow", "mindmap", "stack", "roadmap"]) {
    requireFile(scope, `brain/${file}.md`);
  }
  const pagesDirectory = target("brain/pages");
  if (!existsSync(pagesDirectory)) {
    fail(scope, "missing brain/pages/");
    return;
  }
  const pages = readdirSync(pagesDirectory).filter((name) => name.endsWith(".md"));
  if (pages.length === 0) fail(scope, "brain/pages must contain at least one page");
  for (const page of pages) {
    const relative = `brain/pages/${page}`;
    const content = requireFile(scope, relative);
    for (const key of ["id", "title", "category", "status", "created", "updated"]) {
      if (!frontmatterValue(content, key)) fail(scope, `${relative} missing ${key}`);
    }
    if (!content.includes("## compiled_truth")) fail(scope, `${relative} missing compiled_truth`);
    if (!content.includes("## timeline")) fail(scope, `${relative} missing timeline`);
    const id = frontmatterValue(content, "id");
    if (id && !index.includes(`[[${id}]]`)) fail(scope, `brain/index.md must link [[${id}]]`);
  }
}

function checkTemplates() {
  const scope = "templates";
  if (!exists("templates/catalog.json")) return;
  let catalog;
  try {
    catalog = JSON.parse(readFileSync(target("templates/catalog.json"), "utf8"));
  } catch {
    fail(scope, "templates/catalog.json is invalid JSON");
    return;
  }
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.files)) {
    fail(scope, "catalog must use schemaVersion 1 and contain files[]");
    return;
  }
  const targets = new Set();
  for (const entry of catalog.files) {
    if (!entry.source || !entry.target || !entry.module || !entry.ownership) {
      fail(scope, "every catalog entry needs source, target, module, and ownership");
      continue;
    }
    if (targets.has(entry.target)) fail(scope, `duplicate target ${entry.target}`);
    targets.add(entry.target);
    if (!new Set(["seed", "managed", "merged"]).has(entry.ownership)) {
      fail(scope, `invalid ownership for ${entry.target}`);
    }
    requireFile(scope, entry.source);
  }
}

const checks = {
  instructions: checkInstructions,
  docs: checkDocs,
  architecture: checkArchitecture,
  brain: checkBrain,
  templates: checkTemplates,
};

let selected = Object.keys(checks);
const onlyIndex = process.argv.indexOf("--only");
if (onlyIndex !== -1) {
  const name = process.argv[onlyIndex + 1];
  if (!checks[name]) {
    console.error(`check: unknown scope ${name ?? ""}`);
    process.exit(2);
  }
  selected = [name];
}

for (const name of selected) checks[name]();

if (failures.length > 0) {
  for (const failure of failures) console.error(`check: ${failure}`);
  process.exit(1);
}

console.log(`check: ok (${selected.join(", ")})`);
