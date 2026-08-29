# Project Memory — Lessons Learned

> Written and updated by the `introspection` agent (`.claude/agents/introspection.md`),
> which runs (mandatory) after every feature implementation. `implement-feature.md`
> Phase 1.5 reads this file before new work starts — check it for a relevant pattern
> before writing new code, tests, or research prompts.

## Status note (2026-08-29)

This file did not exist before this entry, even though `introspection.md` has referenced
`.claude/memory/MEMORY.md` since it was written, and `implement-feature.md`'s workflow
(worktree → TDD → CI → PR → **mandatory introspection**) has run for at least Phases
1–7 plus several standalone data/UI PRs (see main-repo git log). Whatever introspection
analysis happened on those runs — if the mandatory step was actually invoked — was never
persisted here, so there is no historical metrics baseline to compare this entry against.
The process gap itself is logged below (Gap A) and the read/write loop has been closed
in `implement-feature.md` so this doesn't happen again silently.

## Metrics log

| Feature | Date | Time | Tokens (main / research subagents / ci-agent) | Test iterations | Lint commits | CI (local / remote) |
|---|---|---|---|---|---|---|
| Towing Comparison Section (PR #19) | 2026-08-29 | ~30 min | ~290k / ~1.15M across 8 subagents / ~13k | 2 | 0 | 1 local pass, 0 remote failures |

All targets from `introspection.md` were met this round (test iterations 1–2, lint
commits 0–1, remote CI failures 0). Keep logging future features here even when nothing
went wrong — the log is what makes "compare to previous implementations" (Step 2 of
`introspection.md`) possible instead of anecdotal.

## Patterns worth repeating

### 1. Resolve new domain data into the existing core type instead of forking the engine

Towing needed truck/trailer physics (grade, combined drag, per-gear surplus) but reused
the whole existing acceleration/performance engine by writing `resolveTruckToCarSpec()`
to turn a `TruckModel` + `TruckPowertrain` + axle/weight choice into the existing
`CarSpec` type, and by extending `IntegrationParams` with `gradePercent`,
`initialSpeedMs`, `stopAtSpeedMs` — all optional and defaulting to prior behavior.
Result: zero existing tests changed, no parallel "truck engine" to maintain.
**When to reuse**: a new feature's core physics/logic is a generalization of an
existing engine's — extend the shared param type with defaulted optional fields and
write a resolver into the existing domain type, rather than duplicating the engine.

### 2. Parallel research subagents + a programmatic validation pass, not manual transcription

8 parallel Sonnet subagents (one per truck family + one for trailer/aero data) each
returned schema-conforming JSON with sources/confidence notes and a scratchpad backup.
Aggregation into `trucks.json` was checked by a script asserting: curves hit the
advertised peak torque/power at the advertised rpm, curves are monotonic in rpm, and
implied power `P(kW) = T(Nm)·rpm/9549` matches advertised power within ~2%. Result: zero
transcription errors across 27 powertrains / ~250+ curve points. **Use this pattern**
whenever aggregating multiple research subagents' numeric output into a data file:
write the validation assertions before/while writing the aggregation, not after.

### 3. Tell research subagents to verify, not assume, prompt-supplied facts

Two of the 8 truck-research agents corrected errors in the orchestrator's own task
briefs (Ford 6.8L gas actually uses the 10R100, not the 10R140 as the brief assumed;
a Ram HD transmission pairing was misstated) because the prompts explicitly instructed
them to verify against primary sources rather than trust the brief. **Carry forward**:
when writing research-subagent prompts that include specification claims as context,
add an explicit "verify this against a primary source; the brief may be wrong" instruction
— it caught real errors here.

### 4. Hand-derived physics fixture expected values need a calculator/script pass

The only test failures this round (3, on the first run of `towing.test.ts`) were
arithmetic mistakes in hand-computed expected values for trig/drag/grade-force fixtures
(e.g. `sinθ`/`cosθ` at a given grade, aero drag at a given speed) — not implementation
bugs. TDD caught them immediately, but they were avoidable. **Carry forward**: when
writing a physics/engine test fixture's expected value by hand, compute it with a
throwaway script/REPL one-liner (or `node -e`) instead of mental/paper arithmetic before
hardcoding the `toBeCloseTo` assertion — costs seconds, avoids a wasted red test run.

## Process gaps found (not feature bugs)

### A. This file didn't exist — introspection findings were never being persisted

Root cause per `introspection.md`'s own taxonomy: "Missing documentation" plus a
broken loop — nothing in `implement-feature.md` ever told a session to *read*
`.claude/memory/MEMORY.md`, so even a session that dutifully wrote patterns here would
have no forcing function to check it before the next feature, and evidently the file was
just never created in the first place across ~7+ prior features.
**Fix applied**: `implement-feature.md` Phase 1.5 now starts with "read
`.claude/memory/MEMORY.md`", and the Phase 9 checklist item now requires introspection
findings to be *applied* to this file (not merely generated and left in a transcript).

### B. `implement-feature.md` had stale specifics that would actively mislead a future session

- The commit-message template hardcoded `Co-Authored-By: Claude Sonnet 4.6
  <noreply@anthropic.com>`. Actual commits in this repo's history use three different
  model names over time (`Claude Opus 4.6`, `Claude Sonnet 4.6`, `Claude Fable 5` —
  this PR's commits use the last). A hardcoded model name goes stale by construction.
  **Fixed**: template now says to use the current session's actual model name rather
  than a fixed string.
- The worktree example (`git worktree add ../ThrustCurves-[short-name] ...`) illustrated
  a Windows path (`C:/Users/Bruce/workspace/...`). This PR's actual worktree is
  `/home/bruce/workspace/ThrustCurves-towing` (Linux) — the annotated example didn't
  match the environment. **Fixed**: examples generalized, no OS-specific absolute path.

### C. Open item — not addressed in this pass

`CLAUDE.md` is listed in `introspection.md` Step 1 as required context but does not
exist anywhere in this repo's history. Deciding what project-wide conventions belong in
it is a bigger, more deliberate call than a single introspection pass should make
unilaterally (risk of enshrining guesses as "guidelines"); flagging it here so the next
person/session considers seeding it deliberately rather than rediscovering the gap.

## What's already working well (keep doing this)

- **Lint before every commit** kept linting-fix commits at 0 (target 0–1) for this
  feature, across 3 commits touching engine, data, and UI.
- **Pre-flight `npm run lint -- --max-warnings=0` + `npm run build` before PR creation**
  (Phase 5) kept remote CI failures at 0 — local/remote parity held.
- **TDD (tests first)** meant the only red tests were fixture-constant mistakes (Pattern
  4 above), never a real implementation defect surfacing late.
