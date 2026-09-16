#!/usr/bin/env node
// Stacksmith router. Intake flags in, deterministic plan out (JSON).
// node route.mjs --mode AUDIT --age BROWNFIELD --signals ai,frontend --execution FULL
// node route.mjs --test ../evals/cases/routing.json
import { readFileSync } from "node:fs";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
// true when this file is the entry point, even when invoked through a symlink (~/.claude/skills -> ~/.agents/skills)
function isMain() { try { return process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; } }

export const MODES = ["AUDIT", "FEATURE", "PLAN", "GREENFIELD"];
export const AGES = ["GREENFIELD", "BROWNFIELD", "UNKNOWN"];
export const EXECUTIONS = ["FULL", "RECOMMEND-ONLY", "APPLY-ONLY", "DOCUMENT-ONLY"];

export const ALWAYS = ["runtime", "package-manager", "testing", "lint-format", "ci-cd", "agent-legibility"];

export const SIGNALS = {
  ai: { meaning: "LLM or agent calls in code or requirements", categories: ["llm-sdk", "structured-output", "llm-observability", "llm-evals", "prompt-management"] },
  retrieval: { meaning: "a documented retrieval or search-over-documents requirement", categories: ["rag", "embeddings", "vector-search", "reranking", "chunking"] },
  "multi-agent": { meaning: "documented need for several cooperating agents or long-running agent workflows", categories: ["agent-orchestration", "durable-workflows", "agent-memory"] },
  frontend: { meaning: "a browser UI", categories: ["frontend-framework", "ui-kit", "state", "forms", "bundler", "e2e", "visual-regression", "web-performance"] },
  backend: { meaning: "an HTTP or RPC service", categories: ["backend-framework", "api-style", "validation", "auth", "rate-limiting", "retries-timeouts"] },
  crud: { meaning: "forms over a relational store", categories: ["database", "orm", "migrations", "validation", "auth"] },
  "data-pipeline": { meaning: "batch or streaming data movement", categories: ["orchestration", "storage-format", "schema-validation", "idempotency", "scheduling", "observability"] },
  async: { meaning: "queues, workers, cron or events already present or required", categories: ["queues", "background-jobs", "cron", "events"] },
  "multi-tenant": { meaning: "several customers on one deployment", categories: ["authorization", "data-isolation", "rate-limiting"] },
  "high-scale": { meaning: "documented load beyond a single node", categories: ["caching", "load-testing", "reliability-patterns", "cdn"] },
  "stale-deps": { meaning: "many majors behind, advisories, or abandoned packages", categories: ["upgrade-sweep", "dependency-security", "supply-chain"] },
  "house-stack": { meaning: "org conventions or a platform template govern the stack", categories: [] },
  "no-tests": { meaning: "no test runner or empty suites", categories: ["testing", "test-strategy"] },
  "no-ci": { meaning: "no CI configuration", categories: ["ci-cd"] },
  "no-observability": { meaning: "no logging, metrics or tracing beyond console output", categories: ["logging", "metrics", "tracing"] },
  documents: { meaning: "PDF, OCR, image, video or audio processing required", categories: ["document-processing", "media"] },
  browser: { meaning: "scraping, crawling or browser automation required", categories: ["browser-automation", "scraping"] },
  geo: { meaning: "maps or geospatial data required", categories: ["geospatial", "geocoding"] },
  mobile: { meaning: "a native or cross-platform mobile client", categories: ["mobile-framework", "mobile-release"] },
  infra: { meaning: "infrastructure as code, containers or Kubernetes present", categories: ["infrastructure", "containers", "deployment", "secrets"] },
  monorepo: { meaning: "several packages in one repository", categories: ["monorepo-tooling", "build-cache"] },
  "agent-tooling": { meaning: "the user wants better Claude Code or Codex ergonomics for this repo", categories: ["skills", "mcp", "codemods", "architecture-enforcement", "repo-understanding"] },
};

export const GUARDRAILS = {
  base: [
    "Default posture KEEP or BUILD; every ADD names a non-speculative requirement.",
    "Premature list (cache, queue, vector db, workflow engine, agent framework, microservices, k8s) needs a repository trigger.",
    "Every ADD, REPLACE, UPGRADE, REMOVE carries dated evidence.",
    "Approval gate before any change.",
  ],
  BROWNFIELD: [
    "House conventions win; REPLACE needs improvement, migration_cost and removes.",
    "One tool per slot: no second ORM, logger, HTTP abstraction, migration framework, test runner, DI, scheduler, observability stack, state approach, workflow engine.",
    "At least one KEEP with alternative_considered so 'Do not change' is never empty.",
  ],
  GREENFIELD: [
    "Evaluate freely; web-stack.md is a prior, not a mandate; say where requirements diverge.",
    "Prefer the smallest stack that serves the documented load; write load assumptions as UNCONFIRMED when undocumented.",
  ],
  "house-stack": ["REPLACE of a convention requires strong_reason=true and confidence=high, plus a why-mined reason for the convention."],
  ai: ["No vector database, agent framework or prompt framework without a retrieval or multi-agent requirement in the documents."],
  "stale-deps": ["UPGRADE rows first; group by major; each major cites its migration notes; no blanket upgrade."],
  "high-scale": ["Every scale-driven ADD cites the number that demands it."],
};

const PHASES_ALL = ["SCAN", "UNDERSTAND", "RESEARCH", "DECIDE", "REPORT", "GATE", "APPLY", "VERIFY", "EXECUTION-REPORT", "DOCUMENT"];

export function route(input) {
  const errors = [];
  const mode = (input.mode || "").toUpperCase();
  const age = (input.age || "UNKNOWN").toUpperCase();
  const execution = (input.execution || "FULL").toUpperCase();
  const signals = (input.signals || []).map((s) => s.trim()).filter(Boolean);
  if (!MODES.includes(mode)) errors.push(`mode must be one of ${MODES.join(", ")}`);
  if (!AGES.includes(age)) errors.push(`age must be one of ${AGES.join(", ")}`);
  if (!EXECUTIONS.includes(execution)) errors.push(`execution must be one of ${EXECUTIONS.join(", ")}`);
  for (const s of signals) if (!SIGNALS[s]) errors.push(`unknown signal: ${s}`);
  if (errors.length) return { ok: false, errors };

  const categories = new Set(mode === "GREENFIELD" || age === "GREENFIELD" ? ["runtime", "package-manager", "testing", "lint-format", "ci-cd", "agent-legibility", "hosting"] : ALWAYS);
  for (const s of signals) for (const c of SIGNALS[s].categories) categories.add(c);
  if (age === "GREENFIELD" && !signals.includes("frontend") && !signals.includes("backend") && !signals.includes("data-pipeline")) {
    categories.add("architecture-shape");
  }

  const guardrails = [...GUARDRAILS.base];
  if (age === "BROWNFIELD") guardrails.push(...GUARDRAILS.BROWNFIELD);
  if (age === "GREENFIELD") guardrails.push(...GUARDRAILS.GREENFIELD);
  for (const s of signals) if (GUARDRAILS[s]) guardrails.push(...GUARDRAILS[s]);

  let phases;
  switch (execution) {
    case "RECOMMEND-ONLY": phases = PHASES_ALL.slice(0, 6); break; // through GATE, gate records approval for a later APPLY-ONLY run
    case "APPLY-ONLY": phases = ["GATE-CHECK", "APPLY", "VERIFY", "EXECUTION-REPORT"]; break;
    case "DOCUMENT-ONLY": phases = ["GATE-CHECK", "DOCUMENT"]; break;
    default: phases = PHASES_ALL.slice(0, 9); // DOCUMENT only on request
  }

  const scanScope = {
    AUDIT: "whole repository",
    FEATURE: "the subsystem the feature touches plus every category the feature needs",
    PLAN: "the plan's named stack plus the repository it targets",
    GREENFIELD: "requirements documents only; no code to scan",
  }[mode];

  const references = {
    SCAN: "references/scan.md", UNDERSTAND: "references/understand.md", RESEARCH: "references/research.md",
    DECIDE: "references/decide.md", REPORT: "references/report.md", GATE: "SKILL.md#phase-6-gate",
    "GATE-CHECK": "scripts/gate.mjs check", APPLY: "references/apply-verify.md", VERIFY: "references/apply-verify.md",
    "EXECUTION-REPORT": "scripts/gate.mjs report", DOCUMENT: "references/document.md",
  };

  const requiresApproval = phases.includes("APPLY") || phases.includes("DOCUMENT");
  const changesAllowedBeforeGate = false;

  return {
    ok: true, mode, age, execution, signals,
    scanScope,
    categories: [...categories],
    guardrails,
    phases: phases.map((p) => ({ phase: p, reference: references[p] })),
    gate: { requiresApproval, changesAllowedBeforeGate, approvalArtefact: "approvals.json", approvalNeedsUserQuote: true },
    delegation: { maxConcurrentAgents: 4, criticRequiredFor: ["REPLACE", "architecture-change", "premature-list ADD"] },
  };
}

function parseArgs(argv) {
  const out = { signals: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--mode") out.mode = next();
    else if (a === "--age") out.age = next();
    else if (a === "--execution") out.execution = next();
    else if (a === "--signals") out.signals = (next() || "").split(",");
    else if (a === "--test") out.test = next();
    else if (a === "--help" || a === "-h") out.help = true;
    else out.unknown = a;
  }
  return out;
}

function help() {
  console.log(`Stacksmith router
  --mode ${MODES.join("|")}
  --age ${AGES.join("|")}
  --execution ${EXECUTIONS.join("|")}
  --signals a,b,c   (observed in SCAN, never guessed)
  --test <cases.json>

Signals:`);
  for (const [k, v] of Object.entries(SIGNALS)) console.log(`  ${k.padEnd(16)} ${v.meaning}`);
}

function runTests(file) {
  const cases = JSON.parse(readFileSync(file, "utf8"));
  let failed = 0;
  for (const c of cases) {
    const r = route(c.input);
    const problems = [];
    if (c.expect.ok !== undefined && r.ok !== c.expect.ok) problems.push(`ok ${r.ok} != ${c.expect.ok}`);
    if (r.ok) {
      for (const cat of c.expect.categoriesInclude || []) if (!r.categories.includes(cat)) problems.push(`missing category ${cat}`);
      for (const cat of c.expect.categoriesExclude || []) if (r.categories.includes(cat)) problems.push(`unexpected category ${cat}`);
      for (const ph of c.expect.phasesInclude || []) if (!r.phases.some((p) => p.phase === ph)) problems.push(`missing phase ${ph}`);
      for (const ph of c.expect.phasesExclude || []) if (r.phases.some((p) => p.phase === ph)) problems.push(`unexpected phase ${ph}`);
      for (const g of c.expect.guardrailsMatch || []) if (!r.guardrails.some((x) => x.includes(g))) problems.push(`missing guardrail containing "${g}"`);
      if (c.expect.requiresApproval !== undefined && r.gate.requiresApproval !== c.expect.requiresApproval) problems.push(`requiresApproval ${r.gate.requiresApproval}`);
      if (r.gate.changesAllowedBeforeGate !== false) problems.push("changes allowed before gate");
      if (c.expect.lastPhase && r.phases.at(-1).phase !== c.expect.lastPhase) problems.push(`last phase ${r.phases.at(-1).phase} != ${c.expect.lastPhase}`);
    }
    const ok = problems.length === 0;
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"} ${c.name}${ok ? "" : "  " + problems.join("; ")}`);
  }
  console.log(`${cases.length - failed}/${cases.length} routing cases passed`);
  return failed === 0;
}

if (isMain()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { help(); process.exit(0); }
  if (args.test) process.exit(runTests(args.test) ? 0 : 1);
  const r = route(args);
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 2);
}
