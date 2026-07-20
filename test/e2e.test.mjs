import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const cli = path.join(packageRoot, "bin", "agent-harness.mjs");

function run(command, args, cwd) {
  return spawnSync(command, args, { cwd, encoding: "utf8" });
}

function runGit(root, ...args) {
  const result = run("git", args, root);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function runCli(root, ...args) {
  return run(process.execPath, [cli, ...args], root);
}

async function repository() {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-harness-test-"));
  runGit(root, "init", "-q");
  runGit(root, "config", "user.name", "Agent Harness Test");
  runGit(root, "config", "user.email", "agent-harness@example.invalid");
  runGit(root, "config", "commit.gpgsign", "false");
  return root;
}

function commitAll(root, message = "test state") {
  runGit(root, "add", "-A");
  runGit(root, "commit", "-qm", message);
}

test("init installs both tool adapters and is idempotent", async () => {
  const root = await repository();
  const first = runCli(root, "init", "--yes", "--ci", "none");
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /agent-harness init: complete/);

  const manifestPath = path.join(root, ".agent-harness", "manifest.json");
  const originalManifest = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(originalManifest);
  assert.deepEqual(manifest.selection.tools, ["claude", "codex"]);
  assert.deepEqual(manifest.selection.modules, ["brain"]);
  assert.equal(manifest.pending && Object.keys(manifest.pending).length, 0);
  assert.match(await readFile(path.join(root, "AGENTS.md"), "utf8"), /node scripts\/agent\/check\.mjs/);
  assert.match(await readFile(path.join(root, "CLAUDE.md"), "utf8"), /@AGENTS\.md/);

  commitAll(root, "install harness");
  const second = runCli(root, "init", "--yes", "--ci", "none");
  assert.equal(second.status, 0, second.stderr);
  assert.equal(await readFile(manifestPath, "utf8"), originalManifest);

  const check = run(process.execPath, ["scripts/agent/check.mjs"], root);
  assert.equal(check.status, 0, check.stderr);
  const doctor = runCli(root, "doctor", "--json");
  assert.equal(doctor.status, 0, doctor.stderr);
  assert.equal(JSON.parse(doctor.stdout).ok, true);
});

test("init preserves existing seed content and merges shared settings", async () => {
  const root = await repository();
  await writeFile(path.join(root, "AGENTS.md"), "# Existing Rules\n\nKeep this exact text.\n", "utf8");
  await writeFile(path.join(root, ".gitignore"), "custom-output/\n", "utf8");
  await mkdir(path.join(root, ".claude"), { recursive: true });
  await writeFile(
    path.join(root, ".claude", "settings.json"),
    `${JSON.stringify({ permissions: { allow: ["Bash(npm test)"] }, customSetting: true }, null, 2)}\n`,
    "utf8",
  );

  const result = runCli(root, "init", "--yes", "--modules", "none", "--ci", "none");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(path.join(root, "AGENTS.md"), "utf8"), "# Existing Rules\n\nKeep this exact text.\n");
  const ignore = await readFile(path.join(root, ".gitignore"), "utf8");
  assert.match(ignore, /^custom-output\//);
  assert.match(ignore, /# agent-harness:start/);
  const settings = JSON.parse(await readFile(path.join(root, ".claude", "settings.json"), "utf8"));
  assert.equal(settings.customSetting, true);
  assert(settings.permissions.allow.includes("Bash(npm test)"));
  assert(settings.permissions.allow.includes("Bash(node scripts/agent/check.mjs*)"));
  assert.deepEqual(JSON.parse(await readFile(path.join(root, ".mcp.json"), "utf8")), {
    mcpServers: {},
  });
  const manifest = JSON.parse(await readFile(path.join(root, ".agent-harness", "manifest.json"), "utf8"));
  assert.equal(manifest.pending["AGENTS.md"].reason, "seed-adaptation");
  const proposal = await readFile(path.join(root, manifest.pending["AGENTS.md"].proposal), "utf8");
  assert.match(proposal, /Keep this exact text/);
  assert.match(proposal, /docs\/SECURITY\.md/);
  const doctor = runCli(root, "doctor");
  assert.equal(doctor.status, 1);
  assert.match(doctor.stderr, /seed file needs Harness adaptation/);
  await writeFile(path.join(root, "AGENTS.md"), proposal, "utf8");
  const resolvedDoctor = runCli(root, "doctor");
  assert.equal(resolvedDoctor.status, 0, resolvedDoctor.stderr);
});

test("empty and oversized seed files are not reported as healthy", async () => {
  const root = await repository();
  await mkdir(path.join(root, "docs"), { recursive: true });
  await writeFile(path.join(root, "docs", "PRODUCT.md"), "", "utf8");
  const longAgents = [
    "# Existing Agents",
    "docs/SECURITY.md docs/PERFORMANCE.md BRAIN.md node scripts/agent/check.mjs",
    ...Array.from({ length: 151 }, (_, index) => `Rule ${index + 1}`),
    "",
  ].join("\n");
  await writeFile(path.join(root, "AGENTS.md"), longAgents, "utf8");
  const result = runCli(root, "init", "--yes", "--ci", "none");
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(await readFile(path.join(root, ".agent-harness", "manifest.json"), "utf8"));
  assert.equal(manifest.pending["docs/PRODUCT.md"].reason, "seed-adaptation");
  assert.match(manifest.pending["AGENTS.md"].proposal, /\.merge\.md$/);
  const doctor = runCli(root, "doctor");
  assert.equal(doctor.status, 1);
  assert.match(doctor.stderr, /file must not be empty/);
  assert.match(doctor.stderr, /under 150 lines/);
});

test("tool and module flags can install a minimal Codex-only harness", async () => {
  const root = await repository();
  const result = runCli(
    root,
    "init",
    "--yes",
    "--tools",
    "codex",
    "--modules",
    "none",
    "--ci",
    "none",
  );
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(await readFile(path.join(root, ".agent-harness", "manifest.json"), "utf8"));
  assert.deepEqual(manifest.selection.tools, ["codex"]);
  assert.deepEqual(manifest.selection.modules, []);
  assert.equal(runGit(root, "status", "--porcelain").includes("CLAUDE.md"), false);
  assert.equal(runGit(root, "status", "--porcelain").includes("BRAIN.md"), false);
});

test("generated checks follow manifest selection instead of unrelated files", async () => {
  const root = await repository();
  await writeFile(path.join(root, "BRAIN.md"), "# Unmanaged legacy note\n", "utf8");
  await mkdir(path.join(root, ".claude"), { recursive: true });
  await writeFile(path.join(root, ".claude", "legacy.md"), "not part of the harness\n", "utf8");
  const result = runCli(
    root,
    "init",
    "--yes",
    "--tools",
    "codex",
    "--modules",
    "none",
    "--ci",
    "none",
  );
  assert.equal(result.status, 0, result.stderr);
  const check = run(process.execPath, ["scripts/agent/check.mjs"], root);
  assert.equal(check.status, 0, check.stderr);
  const doctor = runCli(root, "doctor");
  assert.equal(doctor.status, 0, doctor.stderr);
});

test("an unchanged update leaves a clean repository unchanged", async () => {
  const root = await repository();
  assert.equal(runCli(root, "init", "--yes", "--ci", "none").status, 0);
  commitAll(root, "install harness");
  const before = await readFile(path.join(root, ".agent-harness", "manifest.json"), "utf8");
  const update = runCli(root, "update", "--yes");
  assert.equal(update.status, 0, update.stderr);
  assert.equal(await readFile(path.join(root, ".agent-harness", "manifest.json"), "utf8"), before);
  assert.equal(runGit(root, "status", "--porcelain"), "");
});

test("CRLF-only changes do not mark managed files as modified", async () => {
  const root = await repository();
  assert.equal(runCli(root, "init", "--yes", "--ci", "none").status, 0);
  for (const relative of [
    "docs/agent/evaluations/general.md",
    ".gitignore",
    "CLAUDE.md",
    ".claude/settings.json",
  ]) {
    const file = path.join(root, ...relative.split("/"));
    const content = await readFile(file, "utf8");
    await writeFile(file, content.replaceAll("\r\n", "\n").replaceAll("\n", "\r\n"), "utf8");
  }
  const doctor = runCli(root, "doctor");
  assert.equal(doctor.status, 0, doctor.stderr);
});

test("update preserves modified managed files and creates a proposal", async () => {
  const root = await repository();
  assert.equal(runCli(root, "init", "--yes", "--ci", "none").status, 0);
  commitAll(root, "install harness");

  const managed = path.join(root, "docs", "agent", "evaluations", "general.md");
  await writeFile(managed, "# Project-specific evaluator\n", "utf8");
  commitAll(root, "customize evaluator");

  const update = runCli(root, "update", "--yes");
  assert.equal(update.status, 0, update.stderr);
  assert.equal(await readFile(managed, "utf8"), "# Project-specific evaluator\n");
  const proposal = path.join(
    root,
    ".agent-harness",
    "proposals",
    "0.1.0",
    "docs",
    "agent",
    "evaluations",
    "general.md",
  );
  assert.match(await readFile(proposal, "utf8"), /Evaluation: General Change/);
  const doctor = runCli(root, "doctor");
  assert.equal(doctor.status, 1);
  assert.match(doctor.stderr, /pending modified proposal/);
});

test("update rejects a dirty worktree unless explicitly allowed", async () => {
  const root = await repository();
  assert.equal(runCli(root, "init", "--yes", "--ci", "none").status, 0);
  const update = runCli(root, "update", "--yes");
  assert.equal(update.status, 1);
  assert.match(update.stderr, /requires a clean Git worktree/);
  const allowed = runCli(root, "update", "--yes", "--allow-dirty");
  assert.equal(allowed.status, 0, allowed.stderr);
});

test("dry-run writes nothing and non-interactive init requires consent", async () => {
  const root = await repository();
  const dryRun = runCli(root, "init", "--dry-run", "--ci", "none");
  assert.equal(dryRun.status, 0, dryRun.stderr);
  assert.equal(runGit(root, "status", "--porcelain"), "");

  const withoutConsent = runCli(root, "init", "--ci", "none");
  assert.equal(withoutConsent.status, 1);
  assert.match(withoutConsent.stderr, /non-interactive use requires --yes/);
});

test("invalid existing JSON is preserved and reported as a proposal", async () => {
  const root = await repository();
  await mkdir(path.join(root, ".claude"), { recursive: true });
  await writeFile(path.join(root, ".claude", "settings.json"), "{ not-json }\n", "utf8");
  const result = runCli(root, "init", "--yes", "--modules", "none", "--ci", "none");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(path.join(root, ".claude", "settings.json"), "utf8"), "{ not-json }\n");
  const manifest = JSON.parse(await readFile(path.join(root, ".agent-harness", "manifest.json"), "utf8"));
  assert.equal(manifest.files[".claude/settings.json"].state, "conflict");
  assert.equal(manifest.pending[".claude/settings.json"].reason.includes("JSON"), true);
  assert.match(manifest.pending[".claude/settings.json"].proposal, /\.merge\.md$/);
  const report = await readFile(path.join(root, manifest.pending[".claude/settings.json"].proposal), "utf8");
  assert.match(report, /Do not replace it with this report/);
});

test("JSON merge replaces the Harness hook by stable identity", async () => {
  const root = await repository();
  await mkdir(path.join(root, ".claude"), { recursive: true });
  const oldHook = {
    hooks: {
      Stop: [
        {
          matcher: "alpha",
          hooks: [
            { type: "command", command: "scripts/agent/check-agent-instructions" },
            { type: "command", command: "npm test" },
          ],
        },
        {
          matcher: "beta",
          hooks: [
            { type: "command", command: "scripts/agent/check-docs" },
            { type: "command", command: "npm run lint" },
          ],
        },
      ],
    },
  };
  await writeFile(path.join(root, ".claude", "settings.json"), `${JSON.stringify(oldHook, null, 2)}\n`, "utf8");
  const result = runCli(root, "init", "--yes", "--modules", "none", "--ci", "none");
  assert.equal(result.status, 0, result.stderr);
  const settings = JSON.parse(await readFile(path.join(root, ".claude", "settings.json"), "utf8"));
  const serialized = JSON.stringify(settings.hooks.Stop);
  assert.doesNotMatch(serialized, /check-agent-instructions/);
  assert.doesNotMatch(serialized, /check-docs/);
  assert.match(serialized, /check\.mjs --only instructions/);
  assert.match(serialized, /npm test/);
  assert.match(serialized, /npm run lint/);
  assert.equal((serialized.match(/check\.mjs --only instructions/g) ?? []).length, 1);
  const alpha = settings.hooks.Stop.find((group) => group.matcher === "alpha");
  const beta = settings.hooks.Stop.find((group) => group.matcher === "beta");
  assert.match(JSON.stringify(alpha), /npm test/);
  assert.doesNotMatch(JSON.stringify(alpha), /npm run lint/);
  assert.match(JSON.stringify(beta), /npm run lint/);
  assert.doesNotMatch(JSON.stringify(beta), /npm test/);
});

test("duplicate managed block markers are preserved as a conflict", async () => {
  const root = await repository();
  const duplicate = [
    "# agent-harness:start",
    "first",
    "# agent-harness:end",
    "# agent-harness:start",
    "second",
    "# agent-harness:end",
    "",
  ].join("\n");
  await writeFile(path.join(root, ".gitignore"), duplicate, "utf8");
  const result = runCli(root, "init", "--yes", "--modules", "none", "--ci", "none");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(path.join(root, ".gitignore"), "utf8"), duplicate);
  const manifest = JSON.parse(await readFile(path.join(root, ".agent-harness", "manifest.json"), "utf8"));
  assert.match(manifest.pending[".gitignore"].reason, /duplicated/);
});

test("doctor reports a corrupt manifest without a stack trace", async () => {
  const root = await repository();
  await mkdir(path.join(root, ".agent-harness"), { recursive: true });
  await writeFile(path.join(root, ".agent-harness", "manifest.json"), "not-json\n", "utf8");
  const result = runCli(root, "doctor", "--json");
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.equal(report.ok, false);
  assert.match(report.issues[0].message, /not valid JSON/);
});

test("doctor rejects malformed manifest structure", async () => {
  const root = await repository();
  await mkdir(path.join(root, ".agent-harness"), { recursive: true });
  await writeFile(
    path.join(root, ".agent-harness", "manifest.json"),
    `${JSON.stringify({ schemaVersion: 1, selection: { tools: "codex", modules: [], ci: "none" }, files: {}, pending: {} })}\n`,
    "utf8",
  );
  const result = runCli(root, "doctor", "--json");
  assert.equal(result.status, 1);
  assert.match(JSON.parse(result.stdout).issues[0].message, /invalid selection/);
});

test("doctor reports version and template metadata drift", async () => {
  const root = await repository();
  assert.equal(runCli(root, "init", "--yes", "--ci", "none").status, 0);
  const manifestPath = path.join(root, ".agent-harness", "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.harnessVersion = "0.0.1";
  manifest.files["docs/agent/evaluations/general.md"].templateHash = "0".repeat(64);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const result = runCli(root, "doctor");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /differs from current/);
  assert.match(result.stderr, /template metadata is outdated/);
});

test("doctor detects removed merged configuration", async () => {
  const root = await repository();
  assert.equal(runCli(root, "init", "--yes", "--ci", "none").status, 0);
  await writeFile(path.join(root, ".gitignore"), "project-only/\n", "utf8");
  const result = runCli(root, "doctor");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /managed block is missing or modified/);
});

test("re-running init on an installed dirty project requires an override", async () => {
  const root = await repository();
  assert.equal(runCli(root, "init", "--yes", "--ci", "none").status, 0);
  await writeFile(path.join(root, "local-change.txt"), "dirty\n", "utf8");
  const blocked = runCli(root, "init", "--yes", "--ci", "none");
  assert.equal(blocked.status, 1);
  assert.match(blocked.stderr, /reconciliation requires a clean Git worktree/);
  const preview = runCli(root, "init", "--dry-run", "--ci", "none");
  assert.equal(preview.status, 0, preview.stderr);
  assert.match(preview.stdout, /dry run: no files written/);
  const allowed = runCli(root, "init", "--yes", "--allow-dirty", "--ci", "none");
  assert.equal(allowed.status, 0, allowed.stderr);
});

test("stack detection recommends UI and API modules", async () => {
  const root = await repository();
  await writeFile(
    path.join(root, "package.json"),
    `${JSON.stringify({
      name: "detected-app",
      scripts: { lint: "eslint .", test: "node --test" },
      dependencies: { react: "latest", express: "latest" },
    }, null, 2)}\n`,
    "utf8",
  );
  const result = runCli(root, "init", "--yes", "--ci", "none");
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(await readFile(path.join(root, ".agent-harness", "manifest.json"), "utf8"));
  assert.deepEqual(manifest.selection.modules, ["api", "brain", "ui"]);
  assert.equal(await readFile(path.join(root, ".claude", "rules", "api", "api.md"), "utf8").then(Boolean), true);
  assert.equal(await readFile(path.join(root, ".claude", "rules", "frontend", "ui.md"), "utf8").then(Boolean), true);
  const quality = await readFile(path.join(root, "docs", "QUALITY.md"), "utf8");
  assert.match(quality, /`npm run lint`/);
  assert.match(quality, /`npm run test`/);
});

test("project names are sanitized before template rendering", async () => {
  const root = await repository();
  await writeFile(path.join(root, "package.json"), '{"name":"safe\\n# injected"}\n', "utf8");
  const result = runCli(root, "init", "--yes", "--tools", "codex", "--ci", "none");
  assert.equal(result.status, 0, result.stderr);
  const background = await readFile(path.join(root, "brain", "background.md"), "utf8");
  assert.doesNotMatch(background, /\n# injected/);
  assert.match(background, /safe injected uses a shared agent harness/);
});

test("init refuses to write through a symlink", { skip: process.platform === "win32" }, async () => {
  const root = await repository();
  const outside = await mkdtemp(path.join(os.tmpdir(), "agent-harness-outside-"));
  await symlink(outside, path.join(root, "docs"));
  const result = runCli(root, "init", "--yes", "--ci", "none");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /refusing to follow symlink/);
});
