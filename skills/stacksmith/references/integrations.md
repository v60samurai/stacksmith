# Integrations: optional helpers Stacksmith uses when present

Stacksmith works with only Node and the host agent. Each helper below improves one phase. Detect it, use it, and say in the run sheet which ones ran. Never fail a phase because a helper is missing; fall back as described.

| Helper | Detect | Improves | Fallback |
|---|---|---|---|
| pstack `how` and `why` skills (Cursor's pstack, ported to Claude Code and Codex) | `~/.agents/skills/how/SKILL.md`, `~/.agents/skills/why/SKILL.md` | SCAN code walkthroughs; UNDERSTAND design rationale from history | read-only research subagents per angle; `git log -S` and PR history |
| pstack `architect`, `arena`, `interrogate` | same directory | DECIDE second opinions on replacements and architecture changes | one critic subagent in a fresh context |
| graft (`graft map`, `graft skeleton`, `graft callers`) | `graft/INDEX.md` in the repository, `graft` on PATH | SCAN orientation; REMOVE verification (no remaining callers) | entry-point reading; grep |
| Docs MCP (context7 or similar) | host lists its tools | RESEARCH official docs and changelogs | the project's docs site via web fetch |
| Web search (host tool, firecrawl, or similar) | host lists it | RESEARCH comparisons, advisories, migration reports | registry metadata only (`npm view`, `gh api`), and lower confidence on every affected row |
| `gh` CLI | `gh --version` | RESEARCH repository activity, licence, archived flag | web fetch of the repository page |
| skills CLI (`npx skills`) | Node present | RESEARCH and APPLY for SKILL scope | manual clone into the host's skills directory |
| `actionlint`, `zizmor` | on PATH | VERIFY for CI scope | the host CI's own dry run |

The pstack skills are not required. With none of them installed, SCAN and DECIDE run on the host's own subagents and are slower and slightly less thorough; the guardrails, the linter and the approval gate are unchanged.
