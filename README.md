<p align="center">
  <img src="assets/banner.png" alt="Stacksmith. Build with the right tools." width="100%">
</p>

# Stacksmith

Stacksmith scans your repo, understands what you are building, researches the current ecosystem, and recommends the smallest, fastest, most reliable and cost-efficient tech stack for your project.

It is a skill for [Claude Code](https://code.claude.com) and [Codex](https://developers.openai.com/codex). It reads your repository first, then researches current frameworks, libraries, infrastructure and developer tooling, tells you what to keep, add, replace, upgrade, remove or avoid, and waits for your approval before changing anything.

![version](https://img.shields.io/badge/version-0.1.0-2b2b2b) ![license](https://img.shields.io/badge/license-MIT-2b2b2b) ![Claude Code plugin](https://img.shields.io/badge/Claude_Code-plugin-d97a3b) ![Codex skill](https://img.shields.io/badge/Codex-skill-d97a3b)

## Why it exists

Developers and coding agents can install almost anything in seconds. Choosing the right thing is now the harder problem.

Most projects do not need more dependencies. They need better decisions about which dependencies, frameworks and infrastructure are actually worth having. Stacksmith is built for that decision. It reads the repository before it reads the ecosystem, it prefers boring technology that fits, and it will say "do nothing, your current stack is right" when that is the answer.

## How it works

```text
Repository
    ↓
Scan          what languages, frameworks, data, infra, tests and tooling are already here
    ↓
Understand    which choices are decisions, conventions, requirements, baggage or gaps
    ↓
Research      current versions, maintenance, licences, compatibility, from primary sources
    ↓
Recommend     one decision per technology, linted against a set of guardrails
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    You approve   (nothing in the repository has changed up to this line)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ↓
Install / change   only the ids you approved, with your package manager and conventions
    ↓
Verify        each change is exercised, not just installed
    ↓
Update docs   plans, tech specs and ADRs reconciled on request
```

Everything above the line is read-only apart from a few artefact files written to `.stacksmith/` in your repo (add that directory to `.gitignore`, or keep the reports; Stacksmith proposes the ignore line rather than editing your files). Everything below the line runs only after you say yes, and the approval is recorded with your own words.

## Example

You:

```text
Run Stacksmith on this repo.
```

Stacksmith, after scanning and researching a mid-sized Next.js app:

```text
Current:
Next.js 15 + Postgres + Prisma + Redis + BullMQ + Langfuse

Recommendations:

KEEP       Postgres          fits the load; nothing else is needed
KEEP       Prisma            the team's migrations and types live here
KEEP       Langfuse          already answering the cost and latency questions
REMOVE     Redis             only BullMQ used it
REPLACE    BullMQ → pg-boss  same queue semantics on the existing Postgres; one service fewer
ADD        Zod at the API boundary   validation is currently scattered across handlers
ADD        dependency-cruiser        the layering rule in CONTRIBUTING.md is not enforced anywhere
BUILD      a 60-line idempotency-key helper instead of a workflow framework
AVOID      Temporal          two retryable jobs do not justify a workflow engine
```

The reasoning behind each line comes from this repository: measured queue volume, the documented layering rule, the two jobs that actually exist. Another repository with the same packages could get different answers. These are project-specific decisions, not a recommended stack.

## Install for Claude Code

### Recommended

```bash
claude plugin marketplace add v60samurai/stacksmith
claude plugin install stacksmith@stacksmith
```

Update later with `claude plugin update stacksmith`.

### Manual

```bash
git clone https://github.com/v60samurai/stacksmith.git
cd stacksmith && ./install.sh claude
```

This links `~/.claude/skills/stacksmith` to the checkout. `./install.sh claude --copy` copies instead; `--update` refreshes an existing install.

### Verify

Start Claude Code in any project and type:

```text
Run Stacksmith on this repo but don't install anything.
```

Stacksmith should answer with a run sheet, then a report, then stop and ask for approval. Nothing in the repository changes.

## Install for Codex

Codex loads user skills from `~/.agents/skills`, so Stacksmith is one copy in one place.

### One command

```bash
git clone https://github.com/v60samurai/stacksmith.git && ./stacksmith/install.sh codex
```

### Manual

```bash
mkdir -p ~/.agents/skills
cp -R stacksmith/skills/stacksmith ~/.agents/skills/stacksmith
```

### Verify

In Codex, type `$stacksmith` followed by a task, or:

```text
Run Stacksmith on this repo but don't install anything.
```

## Shared Claude Code and Codex setup

If you use both, keep one copy and let both hosts read it:

```bash
./install.sh both
```

This installs the skill once at `~/.agents/skills/stacksmith` (which Codex reads directly) and adds a symlink `~/.claude/skills/stacksmith -> ../../.agents/skills/stacksmith` for Claude Code. One directory, no drift, and one `git pull` updates both. If you installed the Claude Code plugin instead, that copy is managed by Claude Code separately; pick one route for Claude Code, not both.

## Usage

```text
Run Stacksmith on this repo.
Audit the stack but don't change anything.
Stacksmith this feature before I start implementation.
Find ways to make this architecture cheaper and faster.
Review only the AI/LLM stack.
Review our testing and reliability stack.
What should we use to build this?                  (greenfield, no code yet)
Apply the approved Stacksmith recommendations.
Update the implementation plan with the approved stack.
```

Stacksmith infers the scope: a whole repository, one feature, an implementation plan or a greenfield project, and only investigates the categories that scope needs.

## What it reviews

Stacksmith can reason across the whole software-development stack, and investigates only the parts your project uses or needs.

- **Application stack.** Frontend, backend, APIs, databases, ORMs and migrations, state, forms, auth and search.
- **AI stack.** LLM SDKs, structured output, agents, RAG, embeddings, memory, evals and LLM observability.
- **Infrastructure.** Hosting, containers, Kubernetes, storage, queues, caching, workflows, CI/CD and deployment.
- **Quality.** Testing at every level, linting, static analysis, architecture boundaries, security, reliability patterns.
- **Developer experience.** Package managers, runtimes, Git workflows, code search, agent tooling, MCP servers, codemods.
- **Specialised systems.** Documents, OCR, images, video, audio, maps and geospatial, scraping, data pipelines.

## Decisions

Every relevant technology gets exactly one of these:

| Decision | Meaning |
|---|---|
| KEEP | The existing choice is right. Stacksmith says so and names the alternative it considered. |
| ADD | A missing capability the requirements need, with the requirement quoted. |
| REPLACE | The improvement clearly outweighs the migration cost. Both are stated. |
| UPGRADE | Right tool, important newer version. |
| REMOVE | No value, superseded, or a duplicate of something already there. |
| BUILD | The need fits in a small owned implementation. |
| GLOBAL | Belongs on your machine as developer or agent tooling, not in the repository. |
| WATCH | Interesting, not mature or needed yet. |
| AVOID | Should explicitly not be introduced, with the reason. |

**BUILD matters.** Stacksmith will sometimes say "this is 100 lines of straightforward code, do not install another framework". A small idempotency helper, a token bucket in your existing database, a five-state state machine: these are usually cheaper to own than to depend on.

**"Do nothing" is a valid recommendation.** A report with an empty recommendations table and a full "do not change" section is a complete result, and on a healthy repository it is the expected one.

The guardrails behind these decisions are enforced by a linter, not just prose: speculative requirements ("we might need caching") fail, infrastructure from the premature list (caches, queues, vector databases, workflow engines, agent frameworks, Kubernetes) needs a trigger in the repository or its documents, two tools in one slot fail, and every change carries dated evidence.

## Stacksmith never installs first

Research and recommendations are safe to run on any repository. Installation, migrations, dependency changes and architecture modifications require your explicit approval, recorded with your own words against each recommendation id.

After approval Stacksmith:

1. re-checks the repository state, branch and your uncommitted changes
2. applies only the approved ids, with the project's package manager and conventions
3. verifies each change by exercising it (a tool that runs, a test that passes, a server that lists the new MCP tool)
4. reports installed, already present, upgraded, removed, built, skipped, failed and needs-manual-action, with a reason for every non-success
5. can reconcile the result into your implementation plan, tech spec or ADRs, replacing the old decision rather than documenting both

### Report format

| Area | Current | Recommendation | Decision | Why |
|---|---|---|---|---|
| Validation | scattered checks | Zod at the API boundary | ADD | one schema boundary, already a transitive dependency |
| Jobs | Redis + BullMQ | pg-boss on the existing Postgres | REPLACE | removes a service; volume is 300 jobs/day |
| Database | Postgres | Postgres | KEEP | already fits the documented load |
| Workflows | none | small local state machine | BUILD | five states, no framework needed |
| Agent framework | none | none | AVOID | one model call per request; no multi-agent requirement |

The full report also carries install scope, cost impact, performance impact, risk and confidence per row, a "do not change" section, architecture changes, an installation plan and an expected-result section with every claim marked measured, inferred or guess. See [docs/report-format.md](docs/report-format.md).

## Examples

Five worked runs across different project shapes, showing that the answers change with the project:

- [Simple SaaS / CRUD](examples/simple-crud.md): almost nothing new.
- [AI-heavy application](examples/ai-heavy.md): evals and observability yes, vector database no.
- [Mature brownfield service](examples/brownfield-house-stack.md): house conventions win.
- [Background processing](examples/data-pipeline.md): idempotency and retries on the database you already run.
- [Greenfield product](examples/greenfield.md): more freedom, still the smallest stack that serves the load.

## Requirements

**Required.** Claude Code or Codex, and Node 18 or newer (the routing, linting and approval scripts are dependency-free Node).

**Recommended.** Web search available to the agent (for current versions and advisories), `gh` for repository activity checks, and the repository's own package manager on PATH so dependency health can be measured instead of guessed.

**Optional.** A docs MCP such as context7, a code-graph tool such as graft, the pstack skills (`how`, `why`, `architect`, `arena`, `interrogate`) for deeper code walkthroughs and second opinions, `actionlint` and `zizmor` for CI verification. Stacksmith detects these and uses them; without them it falls back to the host's own subagents and search. See [skills/stacksmith/references/integrations.md](skills/stacksmith/references/integrations.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). New guardrails, research sources, coverage and tests are welcome. A recommendation is not a contribution unless it comes with the reasoning and evidence that make it project-specific.

Run the tests with `node tests/run.mjs`.

## Licence

MIT. See [LICENSE](LICENSE).
