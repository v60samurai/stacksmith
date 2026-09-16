# Frameworks, protocols and emerging technology

Load in RESEARCH and DECIDE whenever the router lists `application-framework`, `runtime-fit` or any `emerging-ai:*` category. Stacksmith reasons about whole frameworks, protocols and architectural standards, not only libraries and infrastructure primitives.

## First, name the category of the problem

| Kind | What it changes | Examples | Compare it against |
|---|---|---|---|
| framework | how the application is built | FastAPI, Next.js, NestJS | other frameworks, or no framework |
| protocol | how independent systems communicate | MCP, A2A, Agent Client Protocol, OpenAPI | direct API or tool integration, other protocols |
| library | one narrower implementation problem | Zod, p-limit, pg-boss | other libraries, or owned code (BUILD) |
| platform or runtime | owns execution or infrastructure | Temporal, Modal, Kubernetes, Vercel | other platforms, or the existing runtime |
| developer tool | how software is built, never shipped | ast-grep, jj, knip | other tools, or nothing |

Write the `kind` on every recommendation entry. Never compare across kinds as if they were interchangeable products: "MCP or LangChain" is not a decision; "does this system need a protocol, a framework, or three functions" is. Identify the architectural problem first, then search inside the right kind.

## Application frameworks

When the framework decision matters (greenfield, a documented pain with the current one, a runtime question, or an explicit request), research the current ecosystem for the project's language and compare the live candidates. No static preferred list exists; the names below are only where to start looking, and the research date decides what is current.

- Python backend: FastAPI, Django, Flask, Litestar, Starlette, Sanic, Falcon.
- TypeScript and JavaScript backend: Hono, Fastify, Express, NestJS, Elysia, Nitro, Next.js server features (route handlers, server actions).
- Frontend and full-stack: Next.js, React, Remix and React Router, TanStack Start, Astro, SvelteKit, Nuxt, SolidStart.
- Go, Rust, JVM, .NET and others: the current mainstream frameworks of that runtime, considered when the requirements justify the runtime.

Questions Stacksmith answers in this category, each with the evidence that decides it:

| Question | What decides it |
|---|---|
| FastAPI or Django for this Python API? | admin and ORM needs, team familiarity, async and typing requirements, OpenAPI needs, size of the domain model |
| Does this service need a framework at all? | route count, middleware needs, team size; a handful of endpoints on the runtime's standard library is a valid answer |
| Stay on Express or move to Hono or Fastify? | measured latency or throughput problems, typing needs, edge or serverless target, migration cost against the number of routes and middleware |
| Keep the backend inside Next.js or split a service? | deployment coupling, non-HTTP workloads, independent scaling or team ownership, cold-start limits; splitting is an architecture change and needs a critic |
| Is Python (or any runtime) right for this workload? | CPU-bound vs IO-bound, concurrency model, library availability, team skills, operational fit; a runtime change is the largest migration and needs the strongest reason |
| Is the migration worth it? | `improvement` minus `migration_cost` in the entry, both in concrete terms (routes, middleware, tests, days) |

Existing framework choices stay unless the migration provides a meaningful improvement; the linter enforces `improvement`, `migration_cost` and `removes` on every REPLACE.

## Emerging AI infrastructure (research domain)

A first-class research domain, active when the `ai` signal is set. Categories the router lists:

- **emerging-ai:agent-interop.** Agent interoperability standards: MCP (model or agent to tools, resources and prompts), A2A (agent to agent delegation and task lifecycle), Agent Client Protocol (editor or client to coding agent), and whatever is current on the research date. Know the difference before recommending any of them.
- **emerging-ai:agent-runtime.** Agent orchestration, durable and long-running agents, background agents, human-in-the-loop execution, agent sandboxes, multi-agent communication, stateful agent runtimes.
- **emerging-ai:model-infrastructure.** Model gateways, inference routers, provider abstraction, fallback and routing, structured output, tool calling, multimodal models, local inference, batch inference, caching, speculative decoding, model context protocols.
- **emerging-ai:context-engineering.** Context retrieval, memory, context compression, long-context techniques, prompt compilation and optimisation, dynamic tool loading, context budgeting.
- **emerging-ai:evaluation.** Deterministic evals, LLM judges, agent and tool-use evals, trace evaluation, human and judge calibration, prompt optimisation, production shadow evaluation.

Research these against current sources on every run that touches them (see Freshness). Record findings in `research.md` under the category name, and update the radar.

### Evaluating an interoperability protocol

Before any protocol enters a recommendation, answer each line with a dated source:

specification maturity, governance (who owns it, how it changes), vendor adoption, SDK maturity per language, transport model, authentication and security model, discovery, streaming, task lifecycle, interoperability with the other protocols already in use, production adoption you can name, operational complexity, and whether existing APIs or MCP already cover the need.

Never recommend an interoperability protocol where direct API or tool integration is simpler. Two services owned by one team talking over HTTP do not need A2A. One agent calling three internal functions does not need MCP.

## AI architecture questions

When the fingerprint shows meaningful AI functionality, answer all fourteen in `constraints.md` under "AI architecture", each with a one-line answer and its evidence. The linter requires this block when the `ai` signal is set.

1. Is a simple model API call enough?
2. Is structured output needed?
3. Are tools needed?
4. Is MCP useful, or is direct tool integration simpler?
5. Are multiple independent agents actually needed?
6. If yes, is A2A or another interoperability mechanism justified?
7. Does execution need durability?
8. Does the agent need persistent memory?
9. Is retrieval needed?
10. Are evals required before production?
11. What observability is needed?
12. What provider or model abstraction is appropriate?
13. What failure and fallback strategy is needed?
14. What parts should remain deterministic rather than model-driven?

Prefer the smallest architecture that satisfies the requirement. The presence of AI justifies none of the following by itself: an agent framework, A2A, MCP, RAG, a vector database, a memory system, a workflow engine, a multi-agent architecture. Each needs a "yes" above with evidence, and each sits on the linter's premature list.

## Technology radar

A lightweight, dated radar, kept by `scripts/radar.mjs` at `~/.agents/stacksmith/radar.jsonl` (override with `STACKSMITH_RADAR`). Four states:

| State | Meaning |
|---|---|
| ADOPT | useful and mature enough to recommend where it fits |
| TRIAL | promising for selected projects; validate carefully |
| WATCH | important development, usually premature to introduce |
| HOLD | avoid for new projects unless an existing system depends on it |

The radar is not a universal ranking. Every entry carries a `scope` (ecosystem, language, project type, environment) and a `reason`, and a status may differ by scope. Entries are dated; `radar.mjs list` marks entries older than 30 days (14 for volatile ones) as STALE, and a STALE entry narrows the search but never decides.

```bash
node $STACKSMITH/scripts/radar.mjs set MCP --status ADOPT --scope "exposing tools and resources to agents" --reason "..." --source https://... [--volatile]
node $STACKSMITH/scripts/radar.mjs get A2A
node $STACKSMITH/scripts/radar.mjs list [--stale]
```

Example entries, illustrative only and superseded by whatever research finds on the day:

```text
Checked: 2026-09-16

A2A            TRIAL   Meaningful adoption and neutral governance; introduce only when independent agents need cross-system interoperability.
MCP            ADOPT   Strong fit for exposing tools and resources to agents; avoid permanently loading large schemas where CLI or on-demand discovery is cheaper.
FastAPI        ADOPT   (Python API services) Mature, typed, OpenAPI by default; do not migrate a healthy framework merely to use it.
```

## Freshness

Emerging AI technology changes unusually fast. Any decision that touches agent protocols, agent frameworks, model SDKs, inference infrastructure, MCP, A2A, model providers, eval frameworks, AI observability, RAG frameworks, agent memory, or structured-output systems prefers current external research over cached assumptions. The router lists these as `volatileCategories`; the research cache treats their tools as `--volatile` (7 days) and the radar marks them STALE at 14.

Check, in this order: official documentation, official repositories, current releases, governance, recent ecosystem adoption, breaking changes, maintenance activity. Record the verification date on the research entry, the cache entry and the radar entry. Old research narrows the search; it is never proof that the technology remains the right choice.
