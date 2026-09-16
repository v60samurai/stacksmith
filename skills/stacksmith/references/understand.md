# UNDERSTAND: constraints before candidates

Turn the fingerprint into labelled constraints. Every line in the constraint list carries one label:

| Label | Meaning | Treatment in DECIDE |
|---|---|---|
| DECISION | a technical choice someone made on purpose | keep unless a replacement is a meaningful improvement |
| CONVENTION | a house rule (org lint config, shared template, platform team mandate) | wins in brownfield; replacing needs `strong_reason` |
| REQUIREMENT | something the product or documents demand today | must be served |
| FUTURE | a requirement already documented for later | may justify ADD only when the cost of adding later is high |
| BAGGAGE | a decision whose reason no longer exists | candidate for REMOVE or REPLACE |
| ACCIDENTAL | complexity nobody chose (two ORMs, three loggers) | candidate for REMOVE |
| GAP | a missing capability the requirements need | candidate for ADD or BUILD |
| UNCONFIRMED | an assumption you could not verify | ask, or verify, before it drives a decision |

When a decision looks wrong, mine git history (`git log -S`, `git blame`), PR descriptions and docs for the reason, or use a history-mining helper if one is installed (`references/integrations.md`). Replacing a convention without knowing why it exists is the anti-pattern this phase prevents.

## Age decides the strategy

**Brownfield.** Existing conventions win unless replacing them creates a meaningful improvement in fit, simplicity, reliability, performance or cost that the migration cost does not cancel. A second ORM, logger, HTTP abstraction, migration framework, test runner, DI framework, scheduler, observability stack, state approach or workflow engine is a lint violation unless the entry removes the first.

**Greenfield.** Evaluate freely. If the user keeps a personal defaults document (a preferred web stack, an org template), treat it as a prior, not a mandate; state where the project's requirements diverge from it and why.

## Requirement scaling

Write the load profile in numbers where any exist: users, requests, data volume, growth, team size, deploy frequency, budget. A stack for ten internal users and a stack for ten million differ, and most "premature distributed system" recommendations come from skipping this step. Where no number exists, write the assumption and mark it UNCONFIRMED.

## AI-era legibility

Record how the repository looks to a coding agent, because it is a decision input: strict typing, explicit schemas, deterministic commands (`mise tasks`, scripts), architecture rules enforced in code (ast-grep, dependency-cruiser), predictable layout, small context footprint, artefacts on disk, agent docs (CLAUDE.md, AGENTS.md), fast test loop. Gaps here are GAP constraints like any other.

Done when the constraint list has a label on every line and the run sheet shows the age.
