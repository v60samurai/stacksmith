# DECIDE: one decision per technology, linted

## Criteria, in priority order

1. Fit for the actual requirement
2. Simplicity (fewer moving parts, fewer concepts)
3. Reliability
4. Performance
5. Cost
6. Developer experience
7. Security
8. Ecosystem maturity
9. Maintainability
10. Portability and lock-in

Cost is infrastructure, compute, storage, egress, SaaS fees, API usage, operational burden, maintenance, engineering time and deployment complexity. Performance is latency, throughput, memory, CPU, cold start, build time, test time, local loop, deploy time and agent execution efficiency. When two options are roughly equal on fit, the one with fewer moving parts wins.

## Decisions

| Decision | Use when |
|---|---|
| KEEP | the existing choice is fit; write it down so the report can show it was considered |
| ADD | a GAP constraint needs a capability and no existing dependency covers it |
| REPLACE | improvement minus migration cost is clearly positive; the entry names both |
| UPGRADE | right tool, important newer version (security, compatibility, a needed feature) |
| REMOVE | no value, superseded, or ACCIDENTAL duplication |
| WATCH | promising but not mature or not needed yet; no action |
| AVOID | something the project should explicitly not adopt, with the reason |
| BUILD | the requirement fits in a small owned implementation (under roughly 200 lines, no upkeep); scope INTERNAL_IMPLEMENTATION, or CI, CONFIGURATION, INFRASTRUCTURE when the owned change is a workflow or config file |
| GLOBAL | machine-level developer or agent tooling; agent or developer tooling installed on the machine, never in the repository |

Default posture leans KEEP and BUILD. An audit whose every row is ADD is wrong before it is read.

## Scoring

Score each candidate 1 to 5 on the ten criteria. Weighted total uses the priority order as weights (fit 10, simplicity 9, ... lock-in 1). The score ranks candidates; it never overrides a hard constraint (licence, runtime compatibility, house convention). Record the score in the entry so the reader can disagree with a number rather than a feeling. Confidence is high when two independent sources agree and the project has a clear requirement, medium when one of those is missing, low otherwise.

## Guardrails the linter enforces

- ADD requires a `requirement` that is not speculative. "Might need", "in case", "future-proof", "eventually" fail.
- ADD in the premature list (cache, queue, vector database, workflow engine, agent framework, microservices, Kubernetes, service mesh, feature-flag SaaS, event bus, CQRS) requires `trigger`: a repository path or document quote showing the need.
- REPLACE requires `improvement`, `migration_cost` and `removes` (the id or name of what leaves). In brownfield with a house stack it also requires `strong_reason: true` and high confidence.
- One tool per slot. Two live entries (KEEP or ADD) in the same slot (orm, migrations, logger, http-client, test-runner, di, scheduler, observability, state, workflow, validation, forms) fail.
- Every ADD, REPLACE, UPGRADE and REMOVE needs at least one `evidence` source with a date.
- A brownfield audit needs at least one KEEP with `alternative_considered`, so the report's "do not change" section is never empty.
- A protocol (MCP, A2A, Agent Client Protocol) is never ADDed without `interop_requirement`; with the `ai` signal all fourteen AI architecture questions are answered.

## Entry shape (`recommendations.json`)

```json
{
  "project": "name", "mode": "AUDIT", "age": "BROWNFIELD", "signals": ["ai"],
  "recommendations": [
    {
      "id": "r1", "area": "LLM observability", "slot": "observability",
      "current": "none", "recommendation": "Langfuse (self-host, existing Postgres)",
      "decision": "ADD", "install_scope": "RUNTIME_DEPENDENCY",
      "requirement": "PRD section 4 requires per-call cost and latency per tenant",
      "trigger": "docs/PRD.md#observability",
      "why": "...", "cost_impact": "...", "performance_impact": "...",
      "risk": "low", "confidence": "high",
      "score": {"fit": 5, "simplicity": 4, "reliability": 4, "performance": 4, "cost": 5, "dx": 4, "security": 4, "maturity": 4, "maintainability": 4, "lock_in": 4},
      "evidence": [{"source": "https://...", "checked": "2026-09-16", "note": "v3.x active, weekly releases"}],
      "improvement": "...", "migration_cost": "...", "removes": "...", "strong_reason": false,
      "alternative_considered": "..."
    }
  ]
}
```

Install scopes: GLOBAL, RUNTIME_DEPENDENCY, DEV_DEPENDENCY, CI, INFRASTRUCTURE, CONFIGURATION, SKILL, MCP, INTERNAL_IMPLEMENTATION. Kinds: framework, protocol, library, platform, devtool (`references/frameworks-and-emerging.md`). A protocol ADD carries `interop_requirement`. With the `ai` signal, the document carries `ai_architecture: { q1: "...", ..., q14: "..." }`, the fourteen answers with evidence.

## Second opinion before REPORT

Any REPLACE, any architecture change, and any ADD in the premature list gets a critic in a fresh context: a subagent that did not write the recommendation, on a different model where the host allows it. With a design-comparison or architecture-sketch helper installed (`references/integrations.md`), use it for designs with no clear winner or a boundary shape that is not obvious. The critic's objections go into the entry's `why` or flip the decision.

## Anti-patterns the reviewer should name if you commit them

Dependency collecting. Framework churn. Comparing a protocol with a framework or a library as if they were alternatives. MCP or A2A because the application contains agents. Rewriting working infrastructure for marginal gains. Adopting a tool because it is new, popular or well benchmarked. Two tools for one job. Two systems of record. Lock-in without a reason. Premature distribution or microservices. Redis "for caching later". A vector database because the project uses AI. An agent framework where three functions suffice. A workflow engine for a simple state machine. Abstractions before requirements. Replacing a convention without knowing why it exists. Optimising a synthetic number while making operations harder.
