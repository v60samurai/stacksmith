# Example: greenfield product

**Request.** "What should we use to build this?" with a PRD and no code.

**Fingerprint (documents only).** B2B scheduling tool. PRD: SEO marketing pages, an authenticated dashboard, per-workspace data isolation, email notifications, 10k users in year one, two engineers, budget "as close to zero as possible until revenue". No mobile app in scope. No AI feature in the PRD.

**Route.** GREENFIELD, signals `frontend, backend, crud, multi-tenant`. Categories include hosting and architecture shape. Guardrail: the user's own defaults document is a prior, not a mandate; state where the PRD diverges.

**Recommendations.**

| Id | Area | Recommendation | Decision | Scope | Why |
|---|---|---|---|---|---|
| r1 | Web framework | Next.js 15 App Router, TypeScript strict | ADD | RUNTIME_DEPENDENCY | one framework serves the SEO pages and the dashboard; two engineers |
| r2 | Database | Postgres 16 + Drizzle, row-level workspace scoping | ADD | RUNTIME_DEPENDENCY | relational data and workspace isolation in the PRD |
| r3 | Auth | Auth.js with the Postgres adapter | ADD | RUNTIME_DEPENDENCY | email and Google sign-in in the PRD; no per-user SaaS fee at 10k users |
| r4 | Email | Resend with React Email templates | ADD | RUNTIME_DEPENDENCY | notifications in the PRD; free tier covers year one volume |
| r5 | Background jobs | none; send email inline, retry on the next request | BUILD | INTERNAL_IMPLEMENTATION | 10k users, notifications only; a queue is the first WATCH item |
| r6 | Rate limiting | a token bucket in Postgres, ~60 lines | BUILD | INTERNAL_IMPLEMENTATION | one public endpoint; no second store |
| r7 | Hosting | Vercel for the app, Neon for Postgres | ADD | INFRASTRUCTURE | zero fixed cost until traffic; both have exit paths |
| r8 | Testing | Vitest + Playwright for the three PRD journeys | ADD | DEV_DEPENDENCY | journeys are named in the PRD; test them, not units first |
| r9 | Tooling | pnpm, Biome, mise for the Node version | GLOBAL / DEV_DEPENDENCY | | deterministic commands for agents and CI |
| r10 | Caching | Redis | AVOID | | no read path in the PRD needs it; Postgres and Vercel's CDN cover year one |
| r11 | Queue / workflow | none | WATCH | | revisit when a job takes longer than a request |

**Where this diverges from a typical defaults file.** No Redis, no tRPC (two engineers, server actions suffice), no separate API service. Every omission is tied to a PRD number.

**Load assumptions.** 10k users, low write volume: UNCONFIRMED beyond the PRD; the stack has headroom to 10x before anything on this list changes.

**Expected result.** A stack of eight things, two of them owned code, with near-zero fixed cost (measured against provider pricing on the research date) and a test suite shaped like the PRD.

Lint summary: `ADD 7, BUILD 2, GLOBAL 1, AVOID 1, WATCH 1`. Greenfield has no KEEP requirement.
