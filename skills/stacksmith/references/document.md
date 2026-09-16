# DOCUMENT: reconcile decisions into existing documents

Runs on request or in DOCUMENT-ONLY execution. Input: `approvals.json` and `execution-report.md`.

1. **Find the homes.** From the fingerprint's document list: PRD, implementation plan, tech spec, architecture doc, DESIGN.md, TECH_SPEC.md, ADRs, README sections, engineering checklists, `thoughts/shared/plans/*`, `tasks/lessons.md`. List each with the section that mentions stack, architecture, dependencies, infrastructure, testing, observability, security, deployment, phases, checklist or open questions.
2. **Edit in place.** For each approved decision, update the section that owns it. Replace the old decision; do not append the new one beside it. Remove implementation steps that the approved stack makes obsolete and add the steps it needs. Close open questions the decision answers.
3. **ADRs** only where the repository already has them. One ADR per architecture change (REPLACE or an "Architecture changes" entry), in the repository's existing template and numbering. No ADR system is introduced for Stacksmith.
4. **Plans.** When a plan exists, its phases and checklist must match the applied stack so the implementation session inherits decisions instead of remaking them. Rejected ids leave a one-line note in the plan's open questions so the next reader knows the alternative was considered.
5. **No new documents** unless no existing document owns the decision. Then one file, in the repository's documentation convention, named for what it holds, and linked from the nearest index (README or plan).
6. **Report** the files changed and the sections touched, one line each. Old and new architecture never coexist in the same document after this phase.
