#!/usr/bin/env node
// Stacksmith smoke tests. node tests/run.mjs
import { readFileSync, mkdtempSync, existsSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPTS = join(HERE, "..", "skills", "stacksmith", "scripts");
let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"} ${name}${cond ? "" : "  " + detail}`); };
const run = (script, args, env = {}) => spawnSync("node", [join(SCRIPTS, script), ...args], { encoding: "utf8", env: { ...process.env, ...env } });

console.log("# routing");
const r = run("route.mjs", ["--test", join(HERE, "cases", "routing.json")]);
process.stdout.write(r.stdout.split("\n").map((l) => "  " + l).join("\n") + "\n");
ok("routing cases", r.status === 0);

console.log("# lint (decision guardrails)");
const LINT_EXPECT = { "ai-architecture-answered": 0, "ai-protocol-unjustified": 1, "add-almost-nothing": 0, "dependency-collecting": 1, "house-stack-weak-replace": 1, "justified-replacement": 0, "greenfield-web": 0, "stale-deps": 0, "malformed": 1 };
for (const [name, want] of Object.entries(LINT_EXPECT)) {
  const res = run("lint.mjs", [join(HERE, "cases", "lint", `${name}.json`)]);
  ok(`lint ${name} exits ${want}`, res.status === want, res.stdout.trim().split("\n").at(-1));
}
const dc = run("lint.mjs", [join(HERE, "cases", "lint", "dependency-collecting.json")]).stdout;
ok("lint names speculative Redis", /Caching.*speculative/.test(dc));
ok("lint names vector db without trigger", /Vector database.*trigger/.test(dc));
ok("lint names agent framework without trigger", /Agent framework.*trigger/.test(dc));
ok("lint names second ORM", /slot orm has 2 live tools/.test(dc));
const hs = run("lint.mjs", [join(HERE, "cases", "lint", "house-stack-weak-replace.json")]).stdout;
ok("lint blocks weak replacement of house convention", /strong_reason/.test(hs));
const an = run("lint.mjs", [join(HERE, "cases", "lint", "add-almost-nothing.json"), "--json"]).stdout;
ok("add-almost-nothing has 1 ADD, 2 KEEP, 1 BUILD with CI scope", JSON.parse(an).summary.ADD === 1 && JSON.parse(an).summary.KEEP === 2 && JSON.parse(an).summary.BUILD === 1);
ok("route.mjs --help exits 0", run("route.mjs", ["--help"]).status === 0);
ok("cache get reports its path", JSON.parse(run("research-cache.mjs", ["get", "nothing"], { STACKSMITH_CACHE: "/tmp/x-stacksmith.jsonl" }).stdout).cache === "/tmp/x-stacksmith.jsonl");

const ap = run("lint.mjs", [join(HERE, "cases", "lint", "ai-protocol-unjustified.json")]).stdout;
ok("lint requires interop_requirement for a protocol ADD", /protocol ADD needs interop_requirement/.test(ap));
ok("lint requires the 14 AI architecture answers when ai is set", /ai_architecture must answer all 14/.test(ap));
ok("lint rejects an unknown kind", /kind must be one of/.test(ap));
console.log("# technology radar");
{
  const radar = join(mkdtempSync(join(tmpdir(), "stacksmith-radar-")), "radar.jsonl");
  const renv = { STACKSMITH_RADAR: radar };
  ok("radar get miss exits 4", run("radar.mjs", ["get", "A2A"], renv).status === 4);
  ok("radar set without scope refused", run("radar.mjs", ["set", "A2A", "--status", "TRIAL", "--reason", "x"], renv).status !== 0);
  ok("radar set with bad status refused", run("radar.mjs", ["set", "A2A", "--status", "MAYBE", "--scope", "s", "--reason", "x"], renv).status !== 0);
  ok("radar set ok", run("radar.mjs", ["set", "A2A", "--status", "TRIAL", "--scope", "cross-system agents", "--reason", "neutral governance", "--volatile"], renv).status === 0);
  ok("radar get fresh exits 0", run("radar.mjs", ["get", "A2A"], renv).status === 0);
  ok("radar status can differ by scope", run("radar.mjs", ["set", "FastAPI", "--status", "ADOPT", "--scope", "python api services", "--reason", "fit"], renv).status === 0 && run("radar.mjs", ["set", "FastAPI", "--status", "HOLD", "--scope", "cpu-bound workloads", "--reason", "wrong runtime"], renv).status === 0 && JSON.parse(run("radar.mjs", ["get", "fastapi"], renv).stdout).entries.length === 2);
  ok("volatile radar entry older than 14 days is stale", run("radar.mjs", ["set", "MCP", "--status", "ADOPT", "--scope", "tools", "--reason", "fit", "--volatile", "--checked", "2026-08-20"], renv).status === 0 && run("radar.mjs", ["get", "MCP"], renv).status === 3);
  ok("radar list --stale shows only stale", (() => { const o = run("radar.mjs", ["list", "--stale"], renv).stdout; return o.includes("MCP") && !o.includes("A2A"); })());
}
console.log("# approval gate");
const dir = mkdtempSync(join(tmpdir(), "stacksmith-gate-"));
cpSync(join(HERE, "cases", "lint", "justified-replacement.json"), join(dir, "recommendations.json"));
const before = run("gate.mjs", ["check", dir, "r1"]);
ok("check before init fails", before.status !== 0, before.stderr.trim());
ok("init creates approvals with actionable items only", run("gate.mjs", ["init", join(dir, "recommendations.json")]).stdout.includes("2 actionable"));
ok("check pending id exits 1", run("gate.mjs", ["check", dir, "r1"]).status === 1);
ok("record applied on pending id refused", run("gate.mjs", ["record", dir, "r1", "applied"]).status !== 0);
ok("approve without quote refused", run("gate.mjs", ["approve", dir, "--ids", "r1"]).status !== 0);
ok("approve with empty quote refused", run("gate.mjs", ["approve", dir, "--ids", "r1", "--quote", ""]).status !== 0);
ok("approve unknown id refused", run("gate.mjs", ["approve", dir, "--ids", "r9", "--quote", "approve r9"]).status !== 0);
ok("approve r1 with quote", run("gate.mjs", ["approve", dir, "--ids", "r1", "--quote", "approve r1, leave the node upgrade for later"]).status === 0);
ok("check r1 approved exits 0", run("gate.mjs", ["check", dir, "r1"]).status === 0);
ok("check r2 still pending exits 1", run("gate.mjs", ["check", dir, "r2"]).status === 1);
ok("reject r2 with quote", run("gate.mjs", ["reject", dir, "--ids", "r2", "--quote", "leave the node upgrade for later"]).status === 0);
ok("check r2 rejected exits 1", run("gate.mjs", ["check", dir, "r2"]).status === 1);
ok("record applied on approved id", run("gate.mjs", ["record", dir, "r1", "applied", "--note", "pnpm add pg-boss@10; smoke job ran"]).status === 0);
ok("record skipped without note refused", run("gate.mjs", ["record", dir, "r2", "skipped"]).status !== 0);
ok("record skipped on rejected id with note allowed", run("gate.mjs", ["record", dir, "r2", "skipped", "--note", "rejected at gate"]).status === 0);
ok("record invalid outcome refused", run("gate.mjs", ["record", dir, "r1", "done"]).status !== 0);
const rep = run("gate.mjs", ["report", dir]).stdout;
ok("report counts", rep.includes("| TOTAL RECOMMENDED | 3 |") && rep.includes("| TOTAL APPROVED | 1 |") && rep.includes("| INSTALLED / APPLIED | 1 |") && rep.includes("| SKIPPED | 1 |") && rep.includes("| REJECTED AT GATE | 1 |"), rep);
ok("report explains skipped", rep.includes("r2 skipped: rejected at gate"));
const approvals = JSON.parse(readFileSync(join(dir, "approvals.json"), "utf8"));
ok("approval stores the user's quote", approvals.items[0].quote.startsWith("approve r1"));
const all = run("gate.mjs", ["approve", dir, "--ids", "all", "--quote", "approve all"]);
ok("approve all works", all.status === 0 && JSON.parse(run("gate.mjs", ["check", dir, "--all"]).stdout).approved.length === 2);

console.log("# research cache");
const cache = join(mkdtempSync(join(tmpdir(), "stacksmith-cache-")), "research-cache.jsonl");
const env = { STACKSMITH_CACHE: cache };
ok("miss exits 4", run("research-cache.mjs", ["get", "zod"], env).status === 4);
ok("put without source refused", run("research-cache.mjs", ["put", "zod", "--version", "3.23"], env).status !== 0);
ok("put ok", run("research-cache.mjs", ["put", "zod", "--version", "3.23.8", "--source", "https://www.npmjs.com/package/zod", "--status", "active"], env).status === 0);
ok("fresh exits 0", run("research-cache.mjs", ["get", "zod"], env).status === 0);
ok("stale with max-age 0 exits 3", run("research-cache.mjs", ["get", "zod", "--max-age-days", "0"], env).status === 3);
ok("old entry is stale", run("research-cache.mjs", ["put", "langgraph", "--version", "0.2", "--source", "x", "--status", "active", "--volatile", "--checked", "2026-08-01"], env).status === 0 && run("research-cache.mjs", ["get", "langgraph"], env).status === 3);
ok("case-insensitive lookup", run("research-cache.mjs", ["get", "ZOD"], env).status === 0);

console.log("# skill files");
const root = join(HERE, "..", "skills", "stacksmith");
for (const f of ["SKILL.md", "references/frameworks-and-emerging.md", "references/scan.md", "references/understand.md", "references/research.md", "references/decide.md", "references/report.md", "references/apply-verify.md", "references/document.md"]) ok(`exists ${f}`, existsSync(join(root, f)));
const skill = readFileSync(join(root, "SKILL.md"), "utf8");
ok("SKILL.md has frontmatter name", /^---\nname: stacksmith\n/.test(skill));
ok("SKILL.md description under 1024 chars", (skill.match(/description: (.*)\n/) || ["", ""])[1].length < 1024);
ok("SKILL.md names the gate before APPLY", skill.indexOf("## Phase 6: GATE") < skill.indexOf("## Phase 7: APPLY"));
ok("SKILL.md states no changes before approval", /installs nothing, uninstalls nothing/.test(skill));
ok("SKILL.md has no em dash", !skill.includes("—"));
for (const f of ["frameworks-and-emerging.md", "scan.md", "understand.md", "research.md", "decide.md", "report.md", "apply-verify.md", "document.md"]) ok(`${f} has no em dash`, !readFileSync(join(root, "references", f), "utf8").includes("—"));
ok("references/integrations.md exists", existsSync(join(root, "references", "integrations.md")));
ok("SKILL.md carries no personal paths", !/~\/\.claude\/references|Harshit/.test(skill));
console.log("# symlinked invocation");
{
  const linkDir = mkdtempSync(join(tmpdir(), "stacksmith-link-"));
  const { symlinkSync } = require("node:fs");
  symlinkSync(root, join(linkDir, "stacksmith"));
  const viaLink = spawnSync("node", [join(linkDir, "stacksmith", "scripts", "route.mjs"), "--mode", "AUDIT", "--age", "BROWNFIELD"], { encoding: "utf8" });
  ok("route.mjs runs through a symlinked path", viaLink.status === 0 && viaLink.stdout.includes('"ok": true'), viaLink.stdout.slice(0, 80));
}
console.log("# plugin packaging");
const repo = join(HERE, "..");
const plugin = JSON.parse(readFileSync(join(repo, ".claude-plugin", "plugin.json"), "utf8"));
const market = JSON.parse(readFileSync(join(repo, ".claude-plugin", "marketplace.json"), "utf8"));
ok("plugin.json name is stacksmith", plugin.name === "stacksmith");
ok("plugin.json skills path exists", (plugin.skills || []).every((p) => existsSync(join(repo, p, "SKILL.md"))));
ok("marketplace lists the plugin at repo root", market.plugins.some((p) => p.name === "stacksmith" && p.source === "./"));
ok("plugin and marketplace versions match", market.plugins[0].version === plugin.version);
ok("CHANGELOG has the current version", readFileSync(join(repo, "CHANGELOG.md"), "utf8").includes(`[${plugin.version}]`));
ok("Codex agents/openai.yaml exists", existsSync(join(root, "agents", "openai.yaml")));
ok("install.sh is executable", (() => { try { return (require("node:fs").statSync(join(repo, "install.sh")).mode & 0o111) !== 0; } catch { return false; } })());

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
