#!/usr/bin/env node
// Dated technology radar shared by Claude Code and Codex. One JSON line per (technology, scope).
//   radar.mjs set <tech> --status ADOPT|TRIAL|WATCH|HOLD --scope "<where this applies>" --reason "..." [--source URL] [--volatile] [--checked YYYY-MM-DD]
//   radar.mjs get <tech>              -> every scope for the technology, with FRESH|STALE (exit 0 fresh, 3 stale, 4 miss)
//   radar.mjs list [--stale]          -> table
import { readFileSync, writeFileSync, existsSync, mkdirSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
function isMain() { try { return process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; } }

export const RADAR = process.env.STACKSMITH_RADAR || join(homedir(), ".agents", "stacksmith", "radar.jsonl");
export const STATUSES = ["ADOPT", "TRIAL", "WATCH", "HOLD"];
const DEFAULT_DAYS = 30, VOLATILE_DAYS = 14;

function readAll() { return existsSync(RADAR) ? readFileSync(RADAR, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []; }
function writeAll(rows) { mkdirSync(join(RADAR, ".."), { recursive: true }); writeFileSync(RADAR, rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : "")); }
const key = (r) => `${r.tech.toLowerCase()}|${(r.scope || "").toLowerCase()}`;
function freshness(r, now = Date.now()) {
  const days = r.volatile ? VOLATILE_DAYS : DEFAULT_DAYS;
  const age = (now - Date.parse(r.checked)) / 86400000;
  return { state: age <= days ? "FRESH" : "STALE", ageDays: Math.round(age * 10) / 10, maxAgeDays: days };
}

export function set(tech, f) {
  if (!STATUSES.includes(f.status)) throw new Error(`--status must be one of ${STATUSES.join(", ")}`);
  if (!f.scope) throw new Error("--scope is required; a radar status is never universal");
  if (!f.reason) throw new Error("--reason is required");
  const row = { tech, scope: f.scope, status: f.status, reason: f.reason, source: f.source || "", volatile: !!f.volatile, checked: f.checked || new Date().toISOString().slice(0, 10) };
  const rows = readAll().filter((r) => key(r) !== key(row));
  rows.push(row); writeAll(rows);
  return { ...row, radar: RADAR };
}

export function get(tech, now = Date.now()) {
  const rows = readAll().filter((r) => r.tech.toLowerCase() === tech.toLowerCase()).map((r) => ({ ...r, ...freshness(r, now) }));
  return { tech, radar: RADAR, entries: rows, state: rows.length ? (rows.every((r) => r.state === "FRESH") ? "FRESH" : "STALE") : "MISS" };
}

export function list(now = Date.now()) { return readAll().map((r) => ({ ...r, ...freshness(r, now) })); }

function arg(name) { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : undefined; }

if (isMain()) {
  const [cmd, tech] = process.argv.slice(2);
  try {
    if (cmd === "set") console.log(JSON.stringify(set(tech, { status: arg("--status"), scope: arg("--scope"), reason: arg("--reason"), source: arg("--source"), volatile: process.argv.includes("--volatile"), checked: arg("--checked") })));
    else if (cmd === "get") { const r = get(tech); console.log(JSON.stringify(r)); process.exit(r.state === "FRESH" ? 0 : r.state === "STALE" ? 3 : 4); }
    else if (cmd === "list") {
      const rows = list().filter((r) => !process.argv.includes("--stale") || r.state === "STALE");
      console.log(`radar: ${RADAR}`);
      for (const r of rows) console.log(`${r.tech.padEnd(20)} ${r.status.padEnd(6)} ${r.state.padEnd(6)} ${r.checked}  [${r.scope}] ${r.reason}`);
    }
    else { console.error("usage: radar.mjs set|get|list ..."); process.exit(2); }
  } catch (e) { console.error(`radar: ${e.message}`); process.exit(1); }
}
