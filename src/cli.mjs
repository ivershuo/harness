import process from "node:process";
import { createInterface } from "node:readline/promises";
import { applyPlan, doctorHarness, planHarness, readRawManifest } from "./harness.mjs";
import { detectProject, findProjectRoot, isGitDirty, normalizeSelection } from "./project.mjs";

const HELP = `Agent Harness CLI

Usage:
  agent-harness init [directory] [options]
  agent-harness doctor [directory] [--json]
  agent-harness update [directory] [options]

Options:
  --tools codex,claude     Tool adapters to install
  --modules brain,ui,api   Optional modules (use "none" for none)
  --ci github|none         CI integration
  --yes                    Accept the displayed plan
  --dry-run                Display changes without writing
  --allow-dirty            Allow update in a dirty Git worktree
  --json                   Emit doctor results as JSON
  -h, --help               Show this help
`;

function commaList(value) {
  if (value === "none") return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseArgs(argv) {
  const parsed = { command: null, directory: "." };
  const args = [...argv];
  parsed.command = args.shift() ?? "help";
  if (parsed.command === "-h" || parsed.command === "--help") {
    parsed.command = "help";
    parsed.help = true;
  }
  while (args.length > 0) {
    const token = args.shift();
    if (token === "-h" || token === "--help") parsed.help = true;
    else if (token === "--yes") parsed.yes = true;
    else if (token === "--dry-run") parsed.dryRun = true;
    else if (token === "--allow-dirty") parsed.allowDirty = true;
    else if (token === "--json") parsed.json = true;
    else if (token === "--tools") parsed.tools = commaList(args.shift() ?? "");
    else if (token === "--modules") parsed.modules = commaList(args.shift() ?? "");
    else if (token === "--ci") parsed.ci = args.shift();
    else if (token.startsWith("-")) throw new Error(`unknown option: ${token}`);
    else if (parsed.directory === ".") parsed.directory = token;
    else throw new Error(`unexpected argument: ${token}`);
  }
  return parsed;
}

function printSelection(root, detected, selection, command) {
  console.log(`${command} plan for ${root}`);
  console.log(`  tools: ${selection.tools.join(", ")}`);
  console.log(`  modules: ${selection.modules.join(", ") || "none"}`);
  console.log(`  ci: ${selection.ci}`);
  console.log(`  detected stacks: ${detected.stacks.join(", ") || "none"}`);
  console.log(`  package manager: ${detected.packageManager || "none"}`);
  console.log(`  project gates: ${detected.qualityCommands.join(", ") || "none detected"}`);
}

function printActions(plan) {
  const relevant = plan.actions.filter((action) => action.action !== "current");
  if (relevant.length === 0) {
    console.log("  no file changes");
    return;
  }
  for (const action of relevant) console.log(`  ${action.action.padEnd(8)} ${action.path}`);
}

async function confirm() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("non-interactive use requires --yes or --dry-run");
  }
  const reader = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await reader.question("Apply this plan? [Y/n] ")).trim().toLowerCase();
    return answer === "" || answer === "y" || answer === "yes";
  } finally {
    reader.close();
  }
}

async function runDoctor(parsed) {
  const root = await findProjectRoot(parsed.directory);
  const report = await doctorHarness(root);
  if (parsed.json) {
    console.log(JSON.stringify(report, null, 2));
  } else if (report.ok) {
    console.log(`agent-harness doctor: ok (v${report.version})`);
  } else {
    console.error("agent-harness doctor: issues found");
    for (const issue of report.issues) {
      console.error(`  ${issue.path ? `${issue.path}: ` : ""}${issue.message}`);
    }
  }
  if (!report.ok) process.exitCode = 1;
}

async function runMutation(parsed) {
  const root = await findProjectRoot(parsed.directory);
  const previous = await readRawManifest(root);
  if (!parsed.dryRun && (parsed.command === "update" || previous) && !parsed.allowDirty && isGitDirty(root)) {
    throw new Error("reconciliation requires a clean Git worktree; commit changes or use --allow-dirty");
  }
  const detected = detectProject(root);
  const selection = normalizeSelection(parsed, detected, previous?.selection ?? null);
  const plan = await planHarness({
    root,
    selection,
    command: parsed.command,
    projectName: detected.name,
    qualityCommands: detected.qualityCommands,
  });
  printSelection(root, detected, selection, parsed.command);
  printActions(plan);
  if (parsed.dryRun) {
    console.log("dry run: no files written");
    return;
  }
  if (!parsed.yes && !(await confirm())) {
    console.log("cancelled");
    return;
  }
  await applyPlan(root, plan);
  console.log(`agent-harness ${parsed.command}: complete`);
  if (Object.keys(plan.manifest.pending).length > 0) {
    console.log("Review pending proposals, then run agent-harness doctor.");
  }
}

export async function main(argv) {
  const parsed = parseArgs(argv);
  if (parsed.help || parsed.command === "help") {
    console.log(HELP);
    return;
  }
  if (!new Set(["init", "doctor", "update"]).has(parsed.command)) {
    throw new Error(`unknown command: ${parsed.command}`);
  }
  if (parsed.command === "doctor") return runDoctor(parsed);
  return runMutation(parsed);
}
