# Changelog

All notable changes to Stacksmith are recorded here. The format follows Keep a Changelog and the project uses semantic versioning.

## [0.1.0] - 2026-09-16

### Added

- Stacksmith skill: SCAN, UNDERSTAND, RESEARCH, DECIDE, REPORT, approval GATE, APPLY, VERIFY, execution report, DOCUMENT.
- Deterministic router (`scripts/route.mjs`) mapping mode, age and observed signals to categories, guardrails and phases.
- Recommendation linter (`scripts/lint.mjs`) enforcing the decision guardrails: non-speculative requirements, triggers for premature infrastructure, one tool per slot, evidence with dates, house-convention protection, a mandatory "do not change" section for brownfield audits.
- Approval gate and execution ledger (`scripts/gate.mjs`) that records the user's own words with every approval and produces the execution report.
- Dated research cache (`scripts/research-cache.mjs`) shared between Claude Code and Codex.
- Claude Code plugin manifest and marketplace, Codex skill metadata, `install.sh` for manual and shared installs.
- Tests: routing, linter, gate and cache scenarios (`tests/run.mjs`).
- Five worked examples.
