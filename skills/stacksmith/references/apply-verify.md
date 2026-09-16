# APPLY and VERIFY

## Before the first change

- `gate.mjs check <dir> --all` lists approved ids; work only from that list.
- `git status --porcelain` must show no unrelated user changes in files you will touch. Dirty tree in those files: stop and ask.
- Confirm the branch or worktree. Work on a feature branch or a worktree, never on the default branch.
- Record the existing versions and configuration of everything an approved id touches in `execution-log.md` before changing them, so rollback is a copy-paste.

## Applying

- Use the project's package manager as pinned (lockfile, `packageManager` field, mise). Same install flags the repository already uses.
- Install exactly the approved packages at the version the recommendation named. No broad upgrades, no `latest` unless approved.
- GLOBAL scope installs with the machine's package manager (brew, apt, uv tool, npm -g) or the skills CLI (`npx skills add ... -g`). Nothing global lands in the repository.
- SKILL and MCP scope: install where the repository keeps agent tooling (`.claude/skills`, `.mcp.json`, `AGENTS.md`), or globally when the id said GLOBAL.
- BUILD scope: write the small implementation in the repository's conventions, with one runnable check.
- CONFIGURATION scope: edit the existing config file; do not add a parallel one.
- After each id: `gate.mjs record <dir> <id> <outcome> --note "<what happened>"`.

## Verifying

Verification exercises the capability. A package that resolved is not a capability that works. Pick the checks that fit the id and save outputs to `<dir>/verify/<id>.txt`:

| Scope | Minimum verification |
|---|---|
| RUNTIME_DEPENDENCY | install resolves, typecheck, the code path that uses it runs (test or a smoke script) |
| DEV_DEPENDENCY | the tool runs on the repository and produces its output (lint, knip, test run) |
| CI | workflow lints where installed (`actionlint`, `zizmor`), and a dry run or a pushed branch shows the job passing |
| INFRASTRUCTURE | plan or validate command passes; a deploy to preview where one exists |
| CONFIGURATION | the consuming tool reads it without warnings; existing checks still pass |
| SKILL | the host lists it (`ls ~/.claude/skills/<name>/SKILL.md`, Codex `~/.codex/skills`); one invocation |
| MCP | the host lists the server's tools, or a `tools/list` call answers |
| INTERNAL_IMPLEMENTATION | its check passes; the caller path runs |
| GLOBAL | binary on PATH, `--version`, one real invocation |
| UPGRADE | lockfile diff limited to the package and its transitive changes; full test suite |
| REMOVE | build, typecheck and tests pass with it gone; no remaining imports (code graph or grep) |

Run the repository's own full check (`mise tasks`, `pnpm test`, `make check`, whatever it defines) once at the end. A verification failure flips the record to `failed` with the output path; do not retry into a different design without going back through the gate.
