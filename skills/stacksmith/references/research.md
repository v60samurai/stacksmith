# RESEARCH: current ecosystem, primary sources, cached when fresh

Model knowledge is the hypothesis. Sources are the evidence. Every candidate that reaches DECIDE has a source line with a date.

## Scope

Research only the categories the router listed. Within a category, look at both the established option and the newer option that might outperform it. Skip a category when SCAN already shows the current choice is fit, maintained and current; write "no change worth researching" in `research.md` and move on. Most categories in a healthy brownfield repository end here.

## Cache first

```bash
node $STACKSMITH/scripts/research-cache.mjs get <tool>            # FRESH, STALE or MISS
node $STACKSMITH/scripts/research-cache.mjs put <tool> --version 5.2.1 --source "https://..." --status active --caveats "ESM only since v5"
```

FRESH entries (14 days by default, 7 with `--volatile` for fast-moving AI tooling) are reused without a lookup. STALE and MISS trigger a lookup. Re-check regardless when freshness changes the decision: a pending major release, a maintainer change, a security advisory, or a version pin the project depends on. Every tool in one of the router's `volatileCategories` is `--volatile`, and for those a cache hit narrows the search but never replaces a dated check of the official source (`references/frameworks-and-emerging.md`, Freshness).

## Sources, in order of trust

1. Registry metadata: `npm view <pkg> version time --json`, `uv pip index versions`, `cargo info`, `gh api repos/<owner>/<repo>` for pushed_at, open issues, licence, archived flag.
2. Official docs and changelog: the project's docs site, or a docs MCP such as context7 when installed.
3. Repository state via `gh`: release cadence, last commit, issue response, ownership changes.
4. Web search for comparisons, migration reports, incident write-ups, and advisories, with the host's search tool. Prefer developer-focused sources (repository READMEs, issues, changelogs) over listicles.
5. Skill and MCP registries when the capability is agent tooling: `npx skills find <query>` (skills.sh), MCP registry search. Install scope for these is SKILL or MCP, never a project dependency.

For a category with real judgement stakes, delegate one research agent per domain, four at most, one message, each with the category, the project's constraint list, and the fields to return. Research agents report; they do not decide.

## What to verify per candidate

Version, release date, release cadence, last commit, maintainers and any ownership change, adoption signal (dependents, not stars), documentation quality, licence, security history, runtime compatibility with the fingerprint, ecosystem compatibility with what stays, recent breaking changes, drift or abandonment.

## Write it down

`research.md`, one section per category:

```
## <category>
Current: <tool> <version> (<status>)
Candidates:
- <tool> <version> | source <url> | checked <date> | status active|drifting|abandoned | caveats <...>
Verdict for DECIDE: <keep|add|replace|upgrade|remove|watch|avoid|build> because <one line>
```

Then `put` each verified tool into the cache, and `radar.mjs set` its status with a scope and reason. Done when every in-scope category has a section.
