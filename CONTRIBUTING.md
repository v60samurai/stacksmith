# Contributing to Stacksmith

Stacksmith is a skill, not a recommendation list. Contributions that make its judgement sharper, its research more current, or its guardrails harder to game are the ones that help.

## Where things live

| Path | What it is |
|---|---|
| `skills/stacksmith/SKILL.md` | the orchestrator: phases, run sheet, approval gate |
| `skills/stacksmith/references/*.md` | one file per phase, loaded only in that phase |
| `skills/stacksmith/scripts/route.mjs` | signals to categories, guardrails and phases |
| `skills/stacksmith/scripts/lint.mjs` | the decision guardrails, enforced on `recommendations.json` |
| `skills/stacksmith/scripts/gate.mjs` | approval ledger and execution report |
| `skills/stacksmith/scripts/research-cache.mjs` | dated research cache |
| `tests/` | routing, lint, gate, cache and packaging tests |
| `examples/` | worked runs on different project shapes |

## What to contribute

- **Decision logic.** A guardrail the linter should enforce, a signal the router should recognise, a category a signal should trigger. Add the rule, add a failing case under `tests/cases/`, make it pass.
- **Research quality.** Better sources, better verification steps, better freshness rules in `references/research.md`.
- **Coverage.** A project shape Stacksmith handles badly. Add an example under `examples/` that shows the right answer and, where possible, a lint or routing case that would have caught the wrong one.
- **Installation.** Support for another host, a fix for `install.sh` on a platform you use.
- **Documentation.** Shorter is better. Every line in a reference file is read by an agent on every run of that phase.

## What not to contribute

Do not add your favourite framework to a list. Stacksmith has no list of blessed technologies on purpose; recommendations are derived from the project's requirements and current research at run time. A pull request that says "always recommend X for Y" will be closed. A pull request that says "when the fingerprint shows A and the documents require B, the linter should demand C" is welcome.

## Rules for changes

- Every recommendation-shaped claim in an example carries the evidence it came from (a repository path, a document quote, a dated source).
- Keep frontmatter to `name` and `description` so one SKILL.md stays valid for Claude Code plugins, Codex and the Agent Skills spec.
- No new runtime dependencies for the scripts. Node's standard library is enough.
- Run `node tests/run.mjs` before opening a pull request. All cases must pass.
- Bump `version` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` together, and add a CHANGELOG entry.

## Testing a behaviour change

Deterministic tests cover routing, lint, gate and cache. For a change to SKILL.md or a reference file, also run the skill on a small fixture repository (the `examples/` directory describes five shapes) with "don't install anything" and check that it stops at the approval gate with a lint-clean `recommendations.json`. Note what changed in the pull request.
