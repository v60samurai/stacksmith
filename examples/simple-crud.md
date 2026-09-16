# Example: simple SaaS / CRUD app

**Request.** "Run Stacksmith on this repo but don't install anything."

**Fingerprint.** Internal invoicing API. Node 22, Fastify 5, Drizzle + drizzle-kit, Zod 4 at the route boundary, pino, Vitest, Biome, pnpm. One Postgres 16 on Fly.io, deployed from `main` by GitHub Actions. Four source files, two routes, one table. README states ~200 internal users and ~3 req/s peak. CLAUDE.md says "one ORM, one logger, keep the dependency count low".

**Route.** AUDIT, BROWNFIELD, signals `backend, crud, no-tests`. Categories: runtime, package manager, testing, lint/format, CI/CD, agent legibility, backend framework, API style, validation, auth, database, ORM, migrations, test strategy.

**Recommendations.**

| Id | Area | Current | Recommendation | Decision | Scope | Why |
|---|---|---|---|---|---|---|
| r1 | Tests | one placeholder test that throws and catches itself | route tests with Fastify's `app.inject`, ~40 lines | BUILD | INTERNAL_IMPLEMENTATION | CLAUDE.md names `pnpm test` as the completion gate; today it cannot go red |
| r2 | CI | duplicate runs on push and pull_request, read-write token | `concurrency` group, `permissions: contents: read` | ADD | CI | halves CI minutes; the workflow file is the trigger |
| r3 | Runtime | Node 22 (maintenance line) | Node 24 LTS in `mise.toml` and `engines` | UPGRADE | CONFIGURATION | two dependencies already require 22+, 24 is the active LTS |
| r4 | Dead code | none | knip | WATCH | DEV_DEPENDENCY | four files; nothing to find yet |

**Do not change.** Fastify (considered Hono: faster cold start, irrelevant for a long-running Fly app). Drizzle (considered Prisma: heavier client, no gain for one table). Zod 4 (considered valibot: bundle size is irrelevant server-side). pino, Vitest, Biome, pnpm: current and fit.

**Avoid.** Redis or any queue (no background work exists), an LLM SDK (no AI feature is documented), Kubernetes (one Fly app).

**Expected result.** A test suite that can fail (measured: the current one cannot), CI cost halved (inferred from the duplicate trigger), no new runtime dependency. The stack itself was already right.

Lint summary: `KEEP 7, ADD 1, UPGRADE 1, BUILD 1, WATCH 1, AVOID 3, REPLACE 0`.
