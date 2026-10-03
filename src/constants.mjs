export const HARNESS_VERSION = "0.1.1";
export const MANIFEST_SCHEMA_VERSION = 1;
export const MANIFEST_PATH = ".agent-harness/manifest.json";
export const SOURCE = "github:ivershuo/harness";
export const MARKER_START = "<!-- agent-harness:start -->";
export const MARKER_END = "<!-- agent-harness:end -->";

// Portable Node bootstrap; Git supplies the root even for nested cwd.
export const STOP_HOOK_COMMAND = `node -e "const c=require('node:child_process'),p=require('node:path'),u=require('node:url');const fail=()=>console.log(JSON.stringify({systemMessage:'Harness Stop adapter unavailable. Run the harness check and doctor manually.'}));const r=c.spawnSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'});if(r.status!==0){fail();}else{import(u.pathToFileURL(p.join(r.stdout.trim(),'scripts/agent/stop-hook.mjs')).href).catch(fail);}"`;
