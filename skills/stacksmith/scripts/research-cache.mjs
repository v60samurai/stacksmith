#!/usr/bin/env node
// Dated research cache shared by Claude Code and Codex. One JSON line per tool.
//   research-cache.mjs get <tool> [--max-age-days N] [--volatile]   -> FRESH | STALE | MISS (exit 0/3/4)
//   research-cache.mjs put <tool> --version V --source URL --status active|drifting|abandoned [--caveats "..."] [--volatile]
//   research-cache.mjs list
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
// true when this file is the entry point, even when invoked through a symlink (~/.claude/skills -> ~/.agents/skills)
function isMain() { try { return process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; } }

export const CACHE = process.env.STACKSMITH_CACHE || join(homedir(), ".agents", "stacksmith", "research-cache.jsonl");
const DEFAULT_DAYS = 14, VOLATILE_DAYS = 7;

function readAll() {
  if (!existsSync(CACHE)) return [];
  return readFileSync(CACHE, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}
function writeAll(rows) { mkdirSync(join(CACHE, ".."), { recursive: true }); writeFileSync(CACHE, rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : "")); }

export function get(tool, { maxAgeDays, volatile, now = Date.now() } = {}) {
  const row = readAll().filter((r) => r.tool.toLowerCase() === tool.toLowerCase()).at(-1);
  if (!row) return { state: "MISS", tool, cache: CACHE };
  const days = maxAgeDays ?? (volatile || row.volatile ? VOLATILE_DAYS : DEFAULT_DAYS);
  const age = (now - Date.parse(row.checked)) / 86400000;
  return { state: age <= days ? "FRESH" : "STALE", ageDays: Math.round(age * 10) / 10, maxAgeDays: days, cache: CACHE, ...row };
}

export function put(tool, fields) {
  for (const f of ["version", "source", "status"]) if (!fields[f]) throw new Error(`put needs --${f}`);
  const rows = readAll().filter((r) => r.tool.toLowerCase() !== tool.toLowerCase());
  const row = { tool, version: fields.version, source: fields.source, status: fields.status, caveats: fields.caveats || "", volatile: !!fields.volatile, checked: fields.checked || new Date().toISOString().slice(0, 10) };
  rows.push(row);
  writeAll(rows);
  return { ...row, cache: CACHE };
}

function arg(name) { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : undefined; }

if (isMain()) {
  const [cmd, tool] = process.argv.slice(2);
  try {
    if (cmd === "get") {
      const r = get(tool, { maxAgeDays: arg("--max-age-days") ? Number(arg("--max-age-days")) : undefined, volatile: process.argv.includes("--volatile") });
      console.log(JSON.stringify(r));
      process.exit(r.state === "FRESH" ? 0 : r.state === "STALE" ? 3 : 4);
    } else if (cmd === "put") {
      console.log(JSON.stringify(put(tool, { version: arg("--version"), source: arg("--source"), status: arg("--status"), caveats: arg("--caveats"), volatile: process.argv.includes("--volatile"), checked: arg("--checked") })));
    } else if (cmd === "list") {
      for (const r of readAll()) console.log(`${r.tool.padEnd(24)} ${r.version.padEnd(12)} ${r.status.padEnd(10)} ${r.checked}  ${r.caveats}`);
    } else { console.error("usage: research-cache.mjs get|put|list ..."); process.exit(2); }
  } catch (e) { console.error(`research-cache: ${e.message}`); process.exit(1); }
}
