# Example: background processing and data movement

**Request.** "Find ways to make this architecture cheaper and faster."

**Fingerprint.** Nightly ingest of partner CSV files into a warehouse. Python 3.12, a hand-rolled `while True` poller in `jobs/poll.py` over a `jobs` table, no retries, Redis + Celery for two tasks, Postgres, cron on a VM. `docs/incidents/` holds three lost-job incidents in two months. Volume: 40 files and ~2 million rows per night; growth documented at 20% per year.

**Route.** AUDIT, BROWNFIELD, signals `data-pipeline, async, stale-deps`. Categories: orchestration, storage format, schema validation, idempotency, scheduling, observability, queues, background jobs, cron, events, upgrade sweep, dependency security.

**Recommendations.**

| Id | Area | Current | Recommendation | Decision | Scope | Why |
|---|---|---|---|---|---|---|
| r1 | Background jobs | Redis + Celery for two tasks, plus a hand-rolled poller | a Postgres-backed queue (`procrastinate`) replacing both; removes Redis | REPLACE | RUNTIME_DEPENDENCY | improvement: retries, visibility timeouts and dead letters the incident log shows are missing; migration cost: two tasks and one poller, about two days; removes `jobs/poll.py` and Redis |
| r2 | Idempotency | none; a rerun duplicates rows | a 40-line upsert keyed on (partner, file hash, row number) | BUILD | INTERNAL_IMPLEMENTATION | reruns become safe; no framework needed |
| r3 | Schema validation | none | pandera schemas per partner, fail the file not the batch | ADD | RUNTIME_DEPENDENCY | trigger: incident 2026-07-02 (a malformed file poisoned a night) |
| r4 | Storage format | CSV staged on disk | Parquet in the existing object bucket | ADD | RUNTIME_DEPENDENCY | 2M rows/night; columnar staging cuts warehouse load time (verify on real data) |
| r5 | Scheduling | cron on a VM | cron on a VM | KEEP | | considered Airflow and Dagster: 40 files, one DAG; an orchestrator is two more services |
| r6 | Workflow engine | none | none | AVOID | | Temporal considered; three sequential steps do not justify it |
| r7 | Python deps | 14 packages one or more majors behind, one advisory | grouped upgrade by major, advisory first | UPGRADE | RUNTIME_DEPENDENCY | each major cites its migration notes; no blanket upgrade |

**Do not change.** Postgres (considered a warehouse-native queue: adds a hop). Cron (row r5).

**Architecture changes.** One: Redis leaves; the queue moves into Postgres. This is the only REPLACE and it got a second opinion from a critic in a fresh context before the report.

**Expected result.** One service fewer (measured: Redis removed), lost jobs addressed by retries and dead letters (inferred from the incident pattern), safe reruns (measured by the upsert test), lower warehouse load time (guess until measured on Parquet).

Lint summary: `REPLACE 1, BUILD 1, ADD 2, UPGRADE 1, KEEP 2, AVOID 1`.
