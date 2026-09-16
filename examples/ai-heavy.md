# Example: AI-heavy application

**Request.** "Review only the AI/LLM stack."

**Fingerprint.** Customer-support assistant. Next.js 15, Postgres, Prisma, Vercel AI SDK 5 calling one model per request, prompts as template strings in `src/ai/prompts.ts`, no evals, no tracing. PRD section 4: "per-tenant cost and latency must be reportable"; section 6: "answers must cite the tenant's help-centre articles". 40 tenants, ~2,000 conversations per day.

**Route.** AUDIT limited to AI categories, BROWNFIELD, signals `ai, retrieval, multi-tenant`. Categories: LLM SDK, structured output, LLM observability, LLM evals, prompt management, RAG, embeddings, vector search, reranking, chunking.

**Recommendations.**

| Id | Area | Current | Recommendation | Decision | Scope | Why |
|---|---|---|---|---|---|---|
| r1 | LLM observability | none | Langfuse, self-hosted on the existing Postgres | ADD | RUNTIME_DEPENDENCY | trigger: PRD section 4 (per-tenant cost and latency) |
| r2 | Evals | none | promptfoo with 30 golden conversations from support logs, run in CI | ADD | DEV_DEPENDENCY + CI | prompts change weekly and nothing catches regressions |
| r3 | Structured output | JSON parsed from free text | AI SDK `generateObject` with the existing Zod schemas | ADD | CONFIGURATION | the SDK already supports it; removes 80 lines of parsing |
| r4 | Vector search | none | `pgvector` extension on the existing Postgres, 12k article chunks | ADD | INFRASTRUCTURE | trigger: PRD section 6 (citations); volume is far below where a dedicated vector database earns its cost |
| r5 | Prompt management | template strings | keep in code, version with git, name each prompt | KEEP | | 6 prompts, one team; a prompt CMS adds a second system of record |
| r6 | Reranking | none | none | WATCH | | measure retrieval precision on the eval set first |
| r7 | Agent framework | none | none | AVOID | | one model call per turn; no multi-agent requirement in the PRD |

**Do not change.** Vercel AI SDK (considered the provider SDK directly: would lose the provider swap the PRD asks for). Postgres + Prisma (considered a separate vector database: 12k chunks, 40 tenants, no scale trigger).

**Architecture changes.** None. Retrieval lives in the existing database.

**Expected result.** Cost per tenant reportable (measured once Langfuse is live), prompt regressions caught before deploy (inferred), citation retrieval without a new service (measured: pgvector at this volume answers under 50 ms in the maintainers' benchmarks; verify on the real data).

Lint summary: `ADD 4, KEEP 2, WATCH 1, AVOID 1, REPLACE 0`. Every ADD carries a PRD trigger.
