# Changelog

All notable changes to Stacksmith are recorded here. The format follows Keep a Changelog and the project uses semantic versioning.

## [0.2.0] - 2026-09-16

### Added

- Framework and emerging technology awareness (`references/frameworks-and-emerging.md`): kind taxonomy (framework, protocol, library, platform, devtool), cross-ecosystem application framework comparison from current research, the Emerging AI Infrastructure research domain (agent interop, agent runtimes, model infrastructure, context engineering, evaluation), the interoperability-protocol checklist, the fourteen AI architecture questions, and freshness rules for volatile categories.
- Technology radar (`scripts/radar.mjs`): dated ADOPT, TRIAL, WATCH, HOLD entries with a mandatory scope and reason; stale after 30 days, 14 for volatile entries.
- Router: `application-framework`, `runtime-fit`, `ai-architecture` and `emerging-ai:*` categories, a `framework-pain` signal, and `volatileCategories` in the output.
- Linter: `kind` validation, `interop_requirement` on any protocol ADD, protocols and memory systems on the premature list, and all fourteen `ai_architecture` answers required when the `ai` signal is set.
- Tests for the new routing, lint and radar behaviour.

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
