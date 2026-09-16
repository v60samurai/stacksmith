# Stacksmith (repository notes for agents)

This repository distributes one skill: `skills/stacksmith`. There is no application code and no build step.

## Commands

- `node tests/run.mjs` runs every test (routing, lint, gate, cache, packaging). Must pass before a commit.
- `./install.sh status` shows where the skill is installed on this machine.

## Layout

- `skills/stacksmith/SKILL.md` orchestrator; `references/` one file per phase; `scripts/` four dependency-free Node scripts.
- `.claude-plugin/` plugin and marketplace manifests. Keep both `version` fields and CHANGELOG in step.
- `tests/cases/` fixtures; add a case with every guardrail change.
- `examples/` worked runs; each claim carries its evidence.

## Rules

- Frontmatter stays `name` and `description` only.
- No runtime dependencies. Node standard library only.
- Prose: sentence case headings, no em dashes, no marketing language. See CONTRIBUTING.md.
