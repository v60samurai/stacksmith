# Report format

Stacksmith writes two reports. Both are rendered from files on disk in the artefact directory (`.stacksmith/<date>/` inside the repository), so a second session or a reviewer can regenerate them.

## The recommendation report (before approval)

Produced at the end of REPORT. Its first line states that nothing has changed.

```
# Stacksmith report: <project> (<mode>, <age>)
No changes have been made. Approval is required before Phase 7.

## Project fingerprint
## Current stack
## Recommendations
| Area | Current | Recommendation | Decision | Install scope | Why | Cost impact | Performance impact | Risk | Confidence |
## Do not change
## Architecture changes
## Installation plan
## Expected result
## Uncertainty

Approve all, approve by id (for example "approve r1, r3"), or tell me what to change.
```

Install scope is one of GLOBAL, RUNTIME_DEPENDENCY, DEV_DEPENDENCY, CI, INFRASTRUCTURE, CONFIGURATION, SKILL, MCP, INTERNAL_IMPLEMENTATION. The "Do not change" section lists every KEEP with the alternative that was considered, plus WATCH and AVOID rows. Every claim in "Expected result" is marked measured, inferred or guess.

Behind the report is `recommendations.json`, one entry per technology with a weighted score across ten criteria (fit, simplicity, reliability, performance, cost, developer experience, security, maturity, maintainability, lock-in) and dated evidence. `scripts/lint.mjs` must exit 0 before the report is shown.

## The execution report (after apply and verify)

Produced by `scripts/gate.mjs report`.

```
## Stacksmith execution report: <project>

| Metric | Count |
| TOTAL RECOMMENDED | |
| TOTAL ACTIONABLE | |
| TOTAL APPROVED | |
| INSTALLED / APPLIED | |
| ALREADY PRESENT | |
| UPGRADED | |
| REMOVED | |
| BUILT INTERNALLY | |
| SKIPPED | |
| FAILED | |
| NEEDS MANUAL ACTION | |
| REJECTED AT GATE | |
| APPROVED BUT NOT RECORDED | |

### Per item
### Explanations      (one line per skipped, failed or manual id)
### Resulting stack
```

`approvals.json` holds the gate state: each actionable id with its status (pending, approved, rejected), the user's quoted words, and the recorded outcome. Verification outputs are saved under `verify/<id>.txt`.
