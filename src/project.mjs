import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { canonicalRoot } from "./fs-safe.mjs";

function git(args, cwd) {
  return spawnSync("git", args, { cwd, encoding: "utf8" });
}

export async function findProjectRoot(directory) {
  const candidate = await canonicalRoot(directory);
  const result = git(["rev-parse", "--show-toplevel"], candidate);
  if (result.status !== 0) throw new Error("target directory must be inside a Git repository");
  return canonicalRoot(result.stdout.trim());
}

export function isGitDirty(root) {
  const result = git(["status", "--porcelain"], root);
  if (result.status !== 0) throw new Error("unable to inspect Git worktree status");
  return result.stdout.trim().length > 0;
}

function readPackage(root) {
  const file = path.join(root, "package.json");
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function packageManager(root) {
  if (existsSync(path.join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path.join(root, "yarn.lock"))) return "yarn";
  if (existsSync(path.join(root, "bun.lock")) || existsSync(path.join(root, "bun.lockb"))) return "bun";
  return "npm";
}

function safeProjectName(value, fallback) {
  if (typeof value !== "string") return fallback;
  const sanitized = value
    .replace(/[\r\n\t]/g, " ")
    .replace(/[^A-Za-z0-9@._/ -]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
  return sanitized || fallback;
}

export function detectProject(root) {
  const packageJson = readPackage(root);
  const dependencies = {
    ...(packageJson?.dependencies ?? {}),
    ...(packageJson?.devDependencies ?? {}),
  };
  const names = Object.keys(dependencies);
  const hasAny = (patterns) => names.some((name) => patterns.some((pattern) => pattern.test(name)));
  const modules = ["brain"];

  if (
    hasAny([/^react$/, /^next$/, /^vue$/, /^nuxt$/, /^svelte$/, /^@angular\//, /^vite$/]) ||
    existsSync(path.join(root, "src", "components"))
  ) {
    modules.push("ui");
  }
  if (
    hasAny([/^express$/, /^fastify$/, /^koa$/, /^hono$/, /^@nestjs\//]) ||
    existsSync(path.join(root, "openapi.yaml")) ||
    existsSync(path.join(root, "openapi.json"))
  ) {
    modules.push("api");
  }

  const stacks = [];
  const qualityCommands = [];
  if (packageJson) stacks.push("node");
  if (packageJson) {
    const manager = packageManager(root);
    for (const script of ["lint", "typecheck", "test", "test:unit", "test:integration", "build"]) {
      if (typeof packageJson.scripts?.[script] === "string") qualityCommands.push(`${manager} run ${script}`);
    }
  }
  const pyprojectPath = path.join(root, "pyproject.toml");
  if (existsSync(pyprojectPath)) {
    stacks.push("python");
    const pyproject = readFileSync(pyprojectPath, "utf8");
    if (/\bpytest\b/.test(pyproject)) qualityCommands.push("pytest");
    if (/\bruff\b/.test(pyproject)) qualityCommands.push("ruff check .");
    if (/\bmypy\b/.test(pyproject)) qualityCommands.push("mypy .");
  }
  if (existsSync(path.join(root, "go.mod"))) {
    stacks.push("go");
    qualityCommands.push("go test ./...", "go vet ./...");
  }
  if (existsSync(path.join(root, "Cargo.toml"))) {
    stacks.push("rust");
    qualityCommands.push(
      "cargo fmt --check",
      "cargo clippy --all-targets --all-features -- -D warnings",
      "cargo test",
    );
  }

  return {
    name: safeProjectName(packageJson?.name, path.basename(root)),
    modules,
    stacks,
    packageManager: packageJson ? packageManager(root) : null,
    qualityCommands: [...new Set(qualityCommands)],
    ci: existsSync(path.join(root, ".github", "workflows")) ? "github" : "none",
  };
}

export function normalizeSelection(input, detected, previous = null) {
  const allowedTools = new Set(["codex", "claude"]);
  const allowedModules = new Set(["brain", "ui", "api"]);
  const requestedTools = input.tools ?? previous?.tools ?? ["codex", "claude"];
  const requestedModules = input.modules ?? previous?.modules ?? detected.modules;
  const tools = [...new Set([...(previous?.tools ?? []), ...requestedTools])];
  const modules = [...new Set([...(previous?.modules ?? []), ...requestedModules])];
  if (tools.length === 0 || tools.some((tool) => !allowedTools.has(tool))) {
    throw new Error("--tools must contain codex and/or claude");
  }
  if (modules.some((module) => !allowedModules.has(module))) {
    throw new Error("--modules must contain brain, ui, and/or api");
  }
  let ci = input.ci ?? previous?.ci ?? detected.ci;
  if (previous?.ci === "github" && ci === "none") ci = "github";
  if (!["github", "none"].includes(ci)) throw new Error("--ci must be github or none");
  return { tools: tools.sort(), modules: modules.sort(), ci };
}
