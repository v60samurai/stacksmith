#!/usr/bin/env node
// Stacksmith approval gate and execution ledger.
//   gate.mjs init <recommendations.json>                       -> <dir>/approvals.json, everything pending
//   gate.mjs approve <dir> --ids all|r1,r2 --quote "<user's words>"
//   gate.mjs reject  <dir> --ids r3 --quote "<user's words>"
//   gate.mjs check   <dir> <id> | --all                        -> exit 0 only when approved
//   gate.mjs record  <dir> <id> <outcome> [--note "..."]       -> outcome after APPLY/VERIFY
//   gate.mjs report  <dir>                                     -> execution report markdown
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
// true when this file is the entry point, even when invoked through a symlink (~/.claude/skills -> ~/.agents/skills)
function isMain() { try { return process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; } }

export const OUTCOMES = ["applied", "already-present", "upgraded", "removed", "built", "skipped", "failed", "manual"];
const ACTIONABLE = new Set(["ADD", "REPLACE", "UPGRADE", "REMOVE", "BUILD", "GLOBAL"]);

function load(dir) {
  const p = join(dir, "approvals.json");
  if (!existsSync(p)) throw new Error(`no approvals.json in ${dir}; run gate.mjs init first`);
  return [JSON.parse(readFileSync(p, "utf8")), p];
}
function save(p, doc) { writeFileSync(p, JSON.stringify(doc, null, 2) + "\n"); }

export function init(recsPath) {
  const recs = JSON.parse(readFileSync(recsPath, "utf8"));
  const dir = dirname(resolve(recsPath));
  const doc = {
    project: recs.project, created: new Date().toISOString(), source: resolve(recsPath),
    items: (recs.recommendations || []).filter((r) => ACTIONABLE.has(r.decision)).map((r) => ({
      id: r.id, area: r.area, decision: r.decision, recommendation: r.recommendation, install_scope: r.install_scope,
      status: "pending", quote: null, decided_at: null, outcome: null, note: null, recorded_at: null,
    })),
  };
  save(join(dir, "approvals.json"), doc);
  return doc;
}

export function decide(dir, ids, quote, status) {
  if (!quote || quote.trim().length < 3) throw new Error("--quote must contain the user's own words; an approval you cannot quote did not happen");
  const [doc, p] = load(dir);
  const set = ids === "all" ? null : new Set(ids.split(",").map((s) => s.trim()).filter(Boolean));
  const unknown = set ? [...set].filter((id) => !doc.items.some((i) => i.id === id)) : [];
  if (unknown.length) throw new Error(`unknown ids: ${unknown.join(", ")}`);
  let n = 0;
  for (const i of doc.items) if (!set || set.has(i.id)) { i.status = status; i.quote = quote; i.decided_at = new Date().toISOString(); n++; }
  save(p, doc);
  return { changed: n, doc };
}

export function check(dir, id) {
  const [doc] = load(dir);
  if (id === "--all") return { ok: true, approved: doc.items.filter((i) => i.status === "approved").map((i) => i.id), pending: doc.items.filter((i) => i.status === "pending").map((i) => i.id), rejected: doc.items.filter((i) => i.status === "rejected").map((i) => i.id) };
  const item = doc.items.find((i) => i.id === id);
  if (!item) return { ok: false, reason: `unknown id ${id}` };
  if (item.status !== "approved") return { ok: false, reason: `${id} is ${item.status}; not approved` };
  return { ok: true, item };
}

export function record(dir, id, outcome, note) {
  if (!OUTCOMES.includes(outcome)) throw new Error(`outcome must be one of ${OUTCOMES.join(", ")}`);
  const [doc, p] = load(dir);
  const item = doc.items.find((i) => i.id === id);
  if (!item) throw new Error(`unknown id ${id}`);
  if (item.status !== "approved" && !["skipped", "manual"].includes(outcome)) throw new Error(`${id} is ${item.status}; only skipped or manual may be recorded without approval`);
  if (["skipped", "failed", "manual"].includes(outcome) && !note) throw new Error(`${outcome} needs --note explaining why`);
  item.outcome = outcome; item.note = note || null; item.recorded_at = new Date().toISOString();
  save(p, doc);
  return item;
}

export function report(dir) {
  const [doc] = load(dir);
  const recs = existsSync(doc.source) ? JSON.parse(readFileSync(doc.source, "utf8")) : { recommendations: [] };
  const approved = doc.items.filter((i) => i.status === "approved");
  const count = (o) => doc.items.filter((i) => i.outcome === o).length;
  const lines = [
    `## Stacksmith execution report: ${doc.project || ""}`, "",
    `| Metric | Count |`, `|---|---|`,
    `| TOTAL RECOMMENDED | ${recs.recommendations.length} |`,
    `| TOTAL ACTIONABLE | ${doc.items.length} |`,
    `| TOTAL APPROVED | ${approved.length} |`,
    `| INSTALLED / APPLIED | ${count("applied")} |`,
    `| ALREADY PRESENT | ${count("already-present")} |`,
    `| UPGRADED | ${count("upgraded")} |`,
    `| REMOVED | ${count("removed")} |`,
    `| BUILT INTERNALLY | ${count("built")} |`,
    `| SKIPPED | ${count("skipped")} |`,
    `| FAILED | ${count("failed")} |`,
    `| NEEDS MANUAL ACTION | ${count("manual")} |`,
    `| REJECTED AT GATE | ${doc.items.filter((i) => i.status === "rejected").length} |`,
    `| APPROVED BUT NOT RECORDED | ${approved.filter((i) => !i.outcome).length} |`, "",
    `### Per item`, "", `| Id | Area | Decision | Gate | Outcome | Note |`, `|---|---|---|---|---|---|`,
    ...doc.items.map((i) => `| ${i.id} | ${i.area} | ${i.decision} | ${i.status} | ${i.outcome || "-"} | ${i.note || "-"} |`),
    "", `### Explanations`, "",
    ...doc.items.filter((i) => ["skipped", "failed", "manual"].includes(i.outcome)).map((i) => `- ${i.id} ${i.outcome}: ${i.note}`),
    ...(doc.items.some((i) => ["skipped", "failed", "manual"].includes(i.outcome)) ? [] : ["- none"]),
    "", `### Resulting stack`, "", `<fill from the fingerprint plus applied changes>`,
  ];
  return lines.join("\n");
}

function arg(name) { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : undefined; }

if (isMain()) {
  const [cmd, a, b, c] = process.argv.slice(2);
  try {
    switch (cmd) {
      case "init": { const d = init(a); console.log(`approvals.json: ${d.items.length} actionable items pending`); break; }
      case "approve": { const r = decide(a, arg("--ids") || "", arg("--quote"), "approved"); console.log(`approved ${r.changed}`); break; }
      case "reject": { const r = decide(a, arg("--ids") || "", arg("--quote"), "rejected"); console.log(`rejected ${r.changed}`); break; }
      case "check": { const r = check(a, b); console.log(JSON.stringify(r)); process.exit(r.ok ? 0 : 1); }
      case "record": { const r = record(a, b, c, arg("--note")); console.log(`${r.id} ${r.outcome}`); break; }
      case "report": console.log(report(a)); break;
      default: console.error("usage: gate.mjs init|approve|reject|check|record|report ..."); process.exit(2);
    }
  } catch (e) { console.error(`gate: ${e.message}`); process.exit(1); }
}
