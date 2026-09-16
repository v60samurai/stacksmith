# REPORT: the Stacksmith report, then stop

Render from `recommendations.json`. Same content in chat and in `report.md`. No change to the repository has happened yet, and the report says so in its first line.

```
# Stacksmith report: <project> (<mode>, <age>)
No changes have been made. Approval is required before Phase 7.

## Project fingerprint
<six to twelve lines: what it is, who uses it at what scale, the constraints that shaped the decisions, the signals>

## Current stack
<the fingerprint sections that matter, one line each>

## Recommendations
| Area | Current | Recommendation | Decision | Install scope | Why | Cost impact | Performance impact | Risk | Confidence |
|---|---|---|---|---|---|---|---|---|---|
<one row per entry with decision ADD, REPLACE, UPGRADE, REMOVE, BUILD, GLOBAL; id in the Area cell, e.g. "r3 LLM observability">

## Do not change
<one line per KEEP with alternative_considered: "<current>: considered <alternative>; staying because <reason>">
<WATCH and AVOID entries follow, each one line>

## Architecture changes
<only entries that change system design; "none" is a normal answer>

## Installation plan
<exact ordered change list, one line per approved-if-approved id: command or file, scope, verification>

## Expected result
<what becomes faster, cheaper, simpler, safer, easier to maintain, easier for agents; each claim marked measured, inferred or guess>

## Uncertainty
<UNCONFIRMED items and low-confidence rows>

Approve all, approve by id (for example "approve r1, r3"), or tell me what to change.
```

Rules. Benefits stay as small as the evidence. A row with confidence low says so in the Why cell. "Do nothing, the current stack is the right choice" is a complete and welcome report; render it with an empty Recommendations table and a full Do not change section. The report closes with the approval question and nothing after it.
