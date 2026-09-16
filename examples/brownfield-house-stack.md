# Example: mature brownfield service with a house stack

**Request.** "Check whether our stack is still the best choice."

**Fingerprint.** Payments ledger service inside a platform monorepo. Kotlin, Spring Boot 3.3 from the platform template, `org-logger` and `org-http` wrappers from the platform team, Flyway, Gradle, JUnit 5, Testcontainers, GitHub Actions with the org's reusable workflow. 12 engineers, 800 req/s, 99.95% SLO, on-call rota. ARCHITECTURE.md explains that `org-http` exists because it carries the org's tracing headers and retry policy.

**Route.** AUDIT, BROWNFIELD, signals `backend, house-stack, high-scale, infra`. Guardrail: replacing a convention needs `strong_reason: true`, high confidence and the reason the convention exists.

**Recommendations.**

| Id | Area | Current | Recommendation | Decision | Scope | Why |
|---|---|---|---|---|---|---|
| r1 | JDK | 17 | 21 LTS, as the platform template already moved | UPGRADE | CONFIGURATION | virtual threads reduce thread-pool tuning; template parity |
| r2 | Load testing | none in repo | k6 script for the two hot endpoints, run nightly | ADD | CI | trigger: the 99.95% SLO in `docs/slo.md` has no pre-release check |
| r3 | HTTP client | `org-http` | `org-http` | KEEP | | considered plain WebClient: would drop the org's tracing headers and retry policy documented in ARCHITECTURE.md |
| r4 | Logging | `org-logger` | `org-logger` | KEEP | | considered Logback direct: faster in benchmarks, breaks the org's log schema |
| r5 | Migrations | Flyway | Flyway | KEEP | | considered Liquibase: no gain, second migration framework is a lint violation |
| r6 | Framework | Spring Boot 3.3 | Spring Boot 3.3 | KEEP | | considered Micronaut and Quarkus: faster start, but 12 engineers and the platform template are the stack |

**Do not change.** Everything in rows r3 to r6. The alternatives were researched and rejected because the conventions have documented reasons.

**Architecture changes.** None.

**Expected result.** One runtime upgrade with template parity (measured), one guard for the SLO (inferred). The report's main value here is the "do not change" section: four alternatives considered and rejected with reasons, so nobody reopens them next quarter.

Lint summary: `KEEP 4, ADD 1, UPGRADE 1, REPLACE 0`.
