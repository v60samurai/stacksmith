# SCAN: build the project fingerprint

Goal: enough understanding to reason about the stack, gathered progressively, written to `fingerprint.md`. Reading the whole repository is a failure mode.

## Order of operations

1. **Inventory manifests** (one shell call, no agents). Lists languages, package managers, runtimes, monorepo layout, CI, infra and docs.
   ```bash
   cd <repo> && git ls-files | grep -E '(^|/)(package\.json|pnpm-workspace\.yaml|turbo\.json|nx\.json|pyproject\.toml|uv\.lock|requirements.*\.txt|Cargo\.toml|go\.mod|Gemfile|build\.gradle(\.kts)?|pom\.xml|Package\.swift|mise\.toml|\.tool-versions|\.nvmrc|Dockerfile|docker-compose.*\.ya?ml|\.github/workflows/.*|vercel\.json|fly\.toml|railway\.(json|toml)|serverless\.ya?ml|terraform/.*\.tf|\.env\.example|tsconfig.*\.json|biome\.json|\.eslintrc.*|eslint\.config\.*|ruff\.toml|sgconfig\.yml|\.dependency-cruiser.*|knip\.json|CLAUDE\.md|AGENTS\.md|README\.md|DESIGN\.md|TECH_SPEC\.md|ADR.*|docs/adr/.*|thoughts/.*\.md)$' | head -200
   ```
   Then read every manifest and lockfile header found. Record versions as they are, not as you expect them.
2. **Orient.** With a code-graph helper installed (`references/integrations.md`), take its repository map and file skeletons. Without one, read the entry points the manifests name (`main`, `scripts.dev`, route registries, `src/index.*`) and the top-level directory listing, and stop there.
3. **Trace what matters** for each subsystem the router's categories touch and the manifests cannot explain: entry points, request flow, data layer, background work, AI calls. Use a code-walkthrough helper when installed; otherwise spawn read-only research subagents, one per angle, four at most, in one message, each returning components, flow, boundaries and open questions. Without subagents, trace the two or three most important paths yourself and record the rest as UNCONFIRMED.
4. **Read the documents** the inventory found: README, PRD, architecture, plans, ADRs, CLAUDE.md, AGENTS.md, tasks/lessons.md. Documented future requirements count as requirements.
5. **Check dependency health once, mechanically.** Only when a resolved dependency tree exists (`node_modules/`, `.venv/`, `vendor/`, `target/`); installing one is a change and waits for the gate. Without a tree, compare lockfile versions against the registry for the handful of packages that matter and mark the section UNCONFIRMED. With a tree, pick the command the package manager offers and save the output to the artefact directory instead of reading it into context:
   ```bash
   pnpm outdated --format json > <dir>/outdated.json; pnpm audit --json > <dir>/audit.json   # or npm / bun / yarn equivalents
   uv pip list --outdated > <dir>/outdated.txt                                                # Python via uv
   cargo outdated; go list -m -u all; bundle outdated                                          # other ecosystems
   ```
   Summarise counts and the notable items only.

FEATURE mode scans the subsystem the feature touches plus every category the feature will need. PLAN mode reads the plan first and scans what it names. GREENFIELD mode has steps 4 and 5 only, over the requirements documents, plus the shape of any adjacent repository the user names.

## Fingerprint sections

Every section filled or marked "none found". Keep each to the facts; the analysis belongs to UNDERSTAND.

- Languages, runtimes, versions pinned (mise, .nvmrc, engines, pyproject)
- Package managers and lockfiles
- Repository layout: monorepo tool, packages, application boundaries, major modules
- Frontend: framework, UI kit, state, forms, styling, bundler
- Backend: framework, API style (REST, RPC, GraphQL, OpenAPI), validation
- Data: databases, ORM or query builder, migrations, caching, search, vectors
- Async: queues, events, workers, cron, workflows
- AI: SDKs, providers, agent frameworks, prompt management, RAG, evals, LLM observability
- Integrations and external services
- Auth: authentication, authorization, secrets handling
- Observability: logging, metrics, tracing, analytics, feature flags, experiments
- Testing: runners, unit, integration, e2e, contract, property, load, visual
- Quality: lint, format, static analysis, dead-code, architecture rules, codemods
- CI/CD, environments, preview, deployment target, infrastructure as code, containers
- Developer tooling: tasks, scripts, runtime management, agent tooling (skills, MCP, CLAUDE.md, AGENTS.md, code graphs)
- Documents found, with paths
- Dependency health: counts of outdated (major/minor), advisories, abandoned packages spotted
- Age: GREENFIELD or BROWNFIELD, with the evidence

Write the signals the router recognises at the end of the file so Phase 0 can be re-run from it.
