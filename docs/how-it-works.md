# How Stacksmith works

Stacksmith is a markdown skill plus four small Node scripts. The skill holds the judgement; the scripts make the parts that should never vary deterministic.

## Phases

| Phase | Reads | Writes | Done when |
|---|---|---|---|
| 0 Route | the request | run sheet | `route.mjs` returned categories, guardrails and phases |
| 1 Scan | manifests, lockfiles, entry points, docs, dependency health | `fingerprint.md` | every fingerprint section filled or "none found" |
| 2 Understand | fingerprint | labelled constraint list | every line labelled DECISION, CONVENTION, REQUIREMENT, FUTURE, BAGGAGE, ACCIDENTAL, GAP or UNCONFIRMED |
| 3 Research | categories in scope, research cache | `research.md`, cache entries | every category has a verified candidate set or "no change worth researching" |
| 4 Decide | constraints, research | `recommendations.json` | `lint.mjs` exits 0 |
| 5 Report | recommendations | `report.md`, chat | the approval question is the last line |
| 6 Gate | the user's answer | `approvals.json` | each id approved, rejected or pending, with the user's words |
| 7 Apply | approved ids | repository changes, ledger | every approved id recorded |
| 8 Verify | applied ids | `verify/<id>.txt`, ledger | every applied id exercised |
| 9 Execution report | ledger | `execution-report.md`, chat | counts and reasons shown |
| 10 Document | approvals, existing docs | edits to plans, specs, ADRs | old and new decisions never coexist |

## Routing

`route.mjs` takes a mode (AUDIT, FEATURE, PLAN, GREENFIELD), an age (GREENFIELD, BROWNFIELD) and observed signals such as `ai`, `retrieval`, `frontend`, `crud`, `data-pipeline`, `stale-deps`, `house-stack`, `high-scale`. Signals map to categories; age and signals map to guardrails; the execution flag (FULL, RECOMMEND-ONLY, APPLY-ONLY, DOCUMENT-ONLY) maps to phases. Signals come from what SCAN observed, never from the request's vocabulary: a project that "uses AI" gets `ai`, but `retrieval` only when a document or code path demands retrieval.

## Scoring

Each candidate is scored 1 to 5 on ten criteria, weighted by priority (fit 10, simplicity 9, reliability 8, performance 7, cost 6, developer experience 5, security 4, maturity 3, maintainability 2, lock-in 1). The score ranks candidates; hard constraints (licence, runtime compatibility, house conventions) override it. Confidence is high with two independent sources and a clear requirement, medium with one missing, low otherwise.

## Guardrails the linter enforces

- ADD needs a non-speculative requirement; "might", "in case", "eventually", "future-proof" fail.
- ADD of a cache, queue, vector database, workflow engine, agent framework, microservices, Kubernetes, service mesh, feature-flag SaaS, event bus or CQRS needs a `trigger`: a repository path or document quote.
- REPLACE needs `improvement`, `migration_cost` and `removes`; with a house stack it also needs `strong_reason: true` and high confidence.
- One live tool per slot (ORM, migrations, logger, HTTP client, test runner, DI, scheduler, observability, state, workflow, validation, forms).
- ADD, REPLACE, UPGRADE and REMOVE carry dated evidence.
- A brownfield audit has at least one KEEP with the alternative it considered.

## Approval

`gate.mjs` refuses to mark an id approved without `--quote`, the user's own sentence. `gate.mjs check` exits non-zero for anything not approved, and APPLY runs it before every change. Outcomes are recorded per id and the execution report is generated from the ledger, not from memory.

## Research cache

`research-cache.mjs` keeps one JSON line per tool at `~/.agents/stacksmith/research-cache.jsonl` (override with `STACKSMITH_CACHE`), shared by Claude Code and Codex. Entries are fresh for 14 days, 7 for volatile tools. Anything whose freshness would change a decision is re-checked regardless.

## Frameworks, protocols and emerging technology

`references/frameworks-and-emerging.md` loads whenever the router lists `application-framework`, `runtime-fit`, `ai-architecture` or an `emerging-ai:*` category. It defines the five kinds (framework, protocol, library, platform, devtool) that every entry must name, the framework comparison questions and what evidence decides each, the emerging AI research domain (agent interop, agent runtimes, model infrastructure, context engineering, evaluation), the checklist for evaluating an interoperability protocol, the fourteen AI architecture questions the linter requires when the `ai` signal is set, the radar, and the freshness rules. The router marks volatile categories in `volatileCategories`; their tools use the 7-day cache window and 14-day radar window.

`scripts/radar.mjs` keeps the radar at `~/.agents/stacksmith/radar.jsonl` (override with `STACKSMITH_RADAR`): one line per technology and scope, with status, reason, source and check date; `get` exits 3 when stale, `list --stale` shows what needs re-checking.

## Optional helpers

See `skills/stacksmith/references/integrations.md`. None are required.
