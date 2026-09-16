#!/usr/bin/env node
// Stacksmith recommendation linter. Enforces decide.md guardrails on recommendations.json.
// node lint.mjs <recommendations.json> [--json]
import { readFileSync } from "node:fs";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
// true when this file is the entry point, even when invoked through a symlink (~/.claude/skills -> ~/.agents/skills)
function isMain() { try { return process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; } }

export const DECISIONS = ["KEEP", "ADD", "REPLACE", "UPGRADE", "REMOVE", "WATCH", "AVOID", "BUILD", "GLOBAL"];
export const SCOPES = ["GLOBAL", "RUNTIME_DEPENDENCY", "DEV_DEPENDENCY", "CI", "INFRASTRUCTURE", "CONFIGURATION", "SKILL", "MCP", "INTERNAL_IMPLEMENTATION"];
export const LEVELS = ["low", "medium", "high"];
export const SLOTS = ["orm", "migrations", "logger", "http-client", "test-runner", "di", "scheduler", "observability", "state", "workflow", "validation", "forms"]; // common slot names; any label is accepted
export const CRITERIA = ["fit", "simplicity", "reliability", "performance", "cost", "dx", "security", "maturity", "maintainability", "lock_in"];
export const WEIGHTS = { fit: 10, simplicity: 9, reliability: 8, performance: 7, cost: 6, dx: 5, security: 4, maturity: 3, maintainability: 2, lock_in: 1 };
const SPECULATIVE = /\b(might|may need|in case|just in case|future[- ]proof|eventually|someday|down the line|later on|we could|nice to have|when we scale|if we grow)\b/i;
const PREMATURE = /\b(redis|memcached|cache layer|caching layer|queue|kafka|rabbitmq|sqs|pub\/?sub|vector (db|database|store)|pinecone|weaviate|qdrant|milvus|workflow engine|temporal|inngest|trigger\.dev|agent framework|langchain|langgraph|crewai|autogen|microservice|kubernetes|k8s|service mesh|istio|launchdarkly|feature[- ]flag saas|event bus|cqrs|event sourcing)\b/i;
const NEEDS_EVIDENCE = new Set(["ADD", "REPLACE", "UPGRADE", "REMOVE"]);
const REQUIRED = ["id", "area", "current", "recommendation", "decision", "install_scope", "why", "cost_impact", "performance_impact", "risk", "confidence"];

export function score(entry) {
  if (!entry.score) return null;
  let total = 0, max = 0;
  for (const c of CRITERIA) {
    const v = Number(entry.score[c]);
    if (!(v >= 1 && v <= 5)) return NaN;
    total += v * WEIGHTS[c];
    max += 5 * WEIGHTS[c];
  }
  return Math.round((total / max) * 100);
}

export function lint(doc) {
  const errors = [], warnings = [];
  const recs = Array.isArray(doc.recommendations) ? doc.recommendations : null;
  if (!recs) return { ok: false, errors: ["recommendations must be an array"], warnings, summary: {} };
  const age = (doc.age || "UNKNOWN").toUpperCase();
  const signals = doc.signals || [];
  const houseStack = signals.includes("house-stack");
  const ids = new Set();
  const liveBySlot = new Map();

  for (const r of recs) {
    const tag = `[${r.id || "?"} ${r.area || "?"}]`;
    for (const f of REQUIRED) if (r[f] === undefined || r[f] === "") errors.push(`${tag} missing field ${f}`);
    if (ids.has(r.id)) errors.push(`${tag} duplicate id`);
    ids.add(r.id);
    if (!DECISIONS.includes(r.decision)) errors.push(`${tag} decision must be one of ${DECISIONS.join(", ")}`);
    if (!SCOPES.includes(r.install_scope)) errors.push(`${tag} install_scope must be one of ${SCOPES.join(", ")}`);
    if (!LEVELS.includes(r.risk)) errors.push(`${tag} risk must be low|medium|high`);
    if (!LEVELS.includes(r.confidence)) errors.push(`${tag} confidence must be low|medium|high`);
    const s = score(r);
    if (Number.isNaN(s)) errors.push(`${tag} score values must be integers 1..5 for ${CRITERIA.join(", ")}`);
    if (s === null && ["ADD", "REPLACE"].includes(r.decision)) warnings.push(`${tag} no score; ADD and REPLACE should carry one`);

    if (NEEDS_EVIDENCE.has(r.decision)) {
      const ev = Array.isArray(r.evidence) ? r.evidence : [];
      if (!ev.length) errors.push(`${tag} ${r.decision} needs at least one evidence entry`);
      for (const e of ev) if (!e.source || !e.checked) errors.push(`${tag} evidence entries need source and checked date`);
    }

    if (r.decision === "ADD") {
      if (!r.requirement) errors.push(`${tag} ADD needs a requirement`);
      else if (SPECULATIVE.test(r.requirement)) errors.push(`${tag} ADD requirement is speculative: "${r.requirement}"`);
      const text = `${r.area} ${r.recommendation}`;
      if (PREMATURE.test(text) && !r.trigger) errors.push(`${tag} ADD on the premature list needs a trigger (repository path or document quote)`);
      if (r.confidence === "low") warnings.push(`${tag} ADD with low confidence; consider WATCH`);
    }

    if (r.decision === "REPLACE") {
      for (const f of ["improvement", "migration_cost", "removes"]) if (!r[f]) errors.push(`${tag} REPLACE needs ${f}`);
      if (age === "BROWNFIELD" && houseStack) {
        if (r.strong_reason !== true) errors.push(`${tag} REPLACE of a house-stack convention needs strong_reason: true`);
        if (r.confidence !== "high") errors.push(`${tag} REPLACE of a house-stack convention needs confidence: high`);
      }
      if (age === "BROWNFIELD" && r.risk === "high" && r.confidence !== "high") warnings.push(`${tag} high-risk REPLACE with non-high confidence`);
    }

    if (r.decision === "BUILD" && !["INTERNAL_IMPLEMENTATION", "CI", "CONFIGURATION", "INFRASTRUCTURE"].includes(r.install_scope)) errors.push(`${tag} BUILD must use install_scope INTERNAL_IMPLEMENTATION, CI, CONFIGURATION or INFRASTRUCTURE`);
    if (r.decision === "GLOBAL" && r.install_scope !== "GLOBAL") errors.push(`${tag} GLOBAL decision must use install_scope GLOBAL`);

    if (r.slot) {
      if (["KEEP", "ADD", "UPGRADE"].includes(r.decision)) {
        const list = liveBySlot.get(r.slot) || [];
        list.push(r);
        liveBySlot.set(r.slot, list);
      }
    }
  }

  for (const [slot, list] of liveBySlot) {
    if (list.length > 1) {
      const removed = new Set(recs.filter((x) => x.decision === "REPLACE" || x.decision === "REMOVE").map((x) => x.removes || x.current));
      const stillLive = list.filter((x) => !removed.has(x.current) && !removed.has(x.id));
      if (stillLive.length > 1) errors.push(`slot ${slot} has ${stillLive.length} live tools (${stillLive.map((x) => x.id).join(", ")}); one tool per slot`);
    }
  }

  const counts = Object.fromEntries(DECISIONS.map((d) => [d, recs.filter((r) => r.decision === d).length]));
  if (age === "BROWNFIELD" && !recs.some((r) => r.decision === "KEEP" && r.alternative_considered)) {
    errors.push("brownfield needs at least one KEEP with alternative_considered (the Do not change section)");
  }
  const changes = counts.ADD + counts.REPLACE;
  if (age === "BROWNFIELD" && recs.length && changes / recs.length > 0.6) warnings.push(`${changes}/${recs.length} rows are ADD or REPLACE; an audit should lean KEEP`);

  return { ok: errors.length === 0, errors, warnings, summary: { total: recs.length, ...counts } };
}

if (isMain()) {
  const file = process.argv[2];
  if (!file) { console.error("usage: lint.mjs <recommendations.json> [--json]"); process.exit(2); }
  const doc = JSON.parse(readFileSync(file, "utf8"));
  const r = lint(doc);
  if (process.argv.includes("--json")) console.log(JSON.stringify(r, null, 2));
  else {
    for (const e of r.errors) console.log(`ERROR ${e}`);
    for (const w of r.warnings) console.log(`WARN  ${w}`);
    console.log(`${r.ok ? "OK" : "FAIL"} ${JSON.stringify(r.summary)}`);
  }
  process.exit(r.ok ? 0 : 1);
}
