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
| Truck Family Grouping + Generation Selector (PR #20) | 2026-08-29 | ~10 min | not measured (see Gap D) | 2 | 0 | 1 local pass (299 tests), 0 remote failures |

All targets from `introspection.md` were met both rounds (test iterations 1–2, lint
commits 0–1, remote CI failures 0). Keep logging future features here even when nothing
went wrong — the log is what makes "compare to previous implementations" (Step 2 of
`introspection.md`) possible instead of anecdotal.

PR #20's 2 test iterations were not an implementation bug: the first `frontend-ci` run
failed 2 pre-existing assertions in `TowingPage.test.tsx` (`getByText('Toyota Tundra')`,
`getByText('Ford F-250 Super Duty')`) that became ambiguous once the add-truck dropdown
stopped appending a generation suffix to its options — the option text then exactly
matched the truck card's `<h3>` title, so two elements matched the same text. Fixed by
asserting on each card's remove button instead of its title text. **Carry forward**: when
a UI change makes an element's accessible text a substring/exact-duplicate of another
element already on the page, grep the touched component's existing tests for
`getByText`/`getByRole(..., {name})` assertions against that same string before writing
new code — cheaper than discovering the collision via a failed CI run.

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

### 5. `vi.mock` + `importOriginal` to clone real data into a synthetic fixture, when real data can't yet exercise a code path

PR #20 (truck family grouping + generation selector) needed to test the multi-generation
UI path — a family with 2+ `TruckModel` entries — but the real catalog only has one
generation per nameplate so far (lookbacks to 2016 are a known future follow-up, see
`towing-comparison-feature` project memory). `TowingPage.generations.test.tsx` mocks
`@/data/trucks` with `vi.mock('@/data/trucks', async importOriginal => {...})`, calls
`importOriginal()` to get the real module, clones the real `ford-f150-2021` entry into a
synthetic `ford-f150-2015` (new id/generation/year range, powertrain curb weights nudged
down), appends it to `TRUCKS`, and rebuilds `TRUCK_FAMILIES`/`findTruck`/`findTruckFamily`/
`familyOfTruck` from the combined list before returning them from the mock factory.
Result: the synthetic fixture is physics-valid by construction (it *is* real data, not
hand-typed), and the test exercises real component code (`buildTruckFamilies`,
`carrySelectionToGeneration`) against it rather than a hand-rolled family object that could
drift from the real shape. **When to reuse**: a UI path only becomes reachable once a data
set crosses some cardinality (2+ of something) that the real data doesn't have yet —
clone-and-mutate a real record via `importOriginal` inside `vi.mock` instead of
hand-authoring a fixture object, so the fixture inherits validity from the real data and
stays in sync with schema changes automatically.

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

**Still open as of PR #20** — still doesn't exist. No action taken this round either, for
the same reason (not this pass's call to make unilaterally).

### D. `introspection.md`'s own "MANDATORY" Total Tokens metric wasn't supplied (PR #20)

`introspection.md`'s Input Requirements section marks `Total Tokens: ~Xk (measure from
Claude usage output - MANDATORY)` as required from the orchestrator. For PR #20 the
orchestrator supplied time, test iterations, lint commits, and CI counts, but not a
token figure — logged above as "not measured". Root cause is the same shape as Gap A:
a documented mandatory input with no forcing function that actually checks it's present
before the introspection agent is invoked. **Fix to consider**: `implement-feature.md`
Phase 9 Step 1 ("Gather metrics") should explicitly say where to read the token count
from (e.g. the harness's own usage/cost summary, if the session has access to it) rather
than leaving it to be estimated or skipped — right now the skill lists "Total time
estimate" first and tokens isn't even in its own Step 1 bullet list, only in
`introspection.md`'s separate input contract, so the two docs disagree on what's
required and it's easy for a session following `implement-feature.md` alone to never
notice the token bullet exists.

### E. Fresh worktree had no git identity, producing a wrong commit author (PR #20)

The first commit made in the freshly-created `ThrustCurves-towing-gens` worktree picked
up an auto-derived committer identity (`bruce@mail.example.com`) because neither the
worktree nor the parent repo had `user.name`/`user.email` configured — every prior
commit on `main` uses `Bruce Lukens <brucedlukens@gmail.com>`. Caught before the PR
existed and fixed with repo-local `git config user.name`/`user.email` (shared across
worktrees since it's the same `.git`) plus `git commit --amend --reset-author` and a
force-push of the not-yet-reviewed branch. No harm done this time only because it was
caught early — a merged commit with the wrong author is much more annoying to fix.
**Fix applied**: none yet to the skill itself — this is the first time it's happened, so
logging it now rather than waiting for a recurrence (contrast Gap F below, which is a
genuine second occurrence).
**Proposed action**: add a step to `implement-feature.md` Phase 1 ("Worktree Setup"),
right after `npm install`, to run `git config user.name` / `git config user.email` and
verify (or set) it before any commits happen in the new worktree — a `git worktree add`
does not always inherit global config depending on how the environment is provisioned,
so checking is cheap insurance against a silently wrong author on a merged commit.

### F. Recurring — the `introspection` custom agent type still isn't registered in the harness session (PR #19 and PR #20)

Both PR #19 (towing comparison) and PR #20 (this one) needed the mandatory Phase 9
introspection step, and both times the harness session running the orchestration only
had `frontend-ci` available as a registered custom `subagent_type` — `introspection` was
not, so both runs fell back to a general-purpose agent pointed directly at
`.claude/agents/introspection.md` and told to follow it. The fallback works (this file is
proof), but it's now happened twice in a row, which crosses `introspection.md`'s own "if
same task is repeated 3+ times, suggest automation" threshold once more — worth checking
next time whether `introspection` needs to be registered wherever `frontend-ci` is
registered (same directory, same discovery mechanism), since the two agent definitions
live side by side in `.claude/agents/` and only one of them is being picked up.
**Fix to consider**: whatever mechanism makes `frontend-ci` show up as a real
`subagent_type` should be checked for why it isn't also picking up `introspection` — this
is an environment/registration question, not a content problem with
`introspection.md` itself.

## What's already working well (keep doing this)

- **Lint before every commit** kept linting-fix commits at 0 (target 0–1) for both PR #19
  (3 commits touching engine, data, and UI) and PR #20 (1 commit, lint run before the
  first test run) — two features running, still 0 lint-fix commits.
- **Pre-flight `npm run lint -- --max-warnings=0` + `npm run build` before PR creation**
  (Phase 5) kept remote CI failures at 0 for both PR #19 and PR #20 — local/remote parity
  has held for 2 consecutive features now.
- **TDD (tests first)** meant every red test across both features was either a
  fixture-constant mistake (PR #19, Pattern 4) or a pre-existing test's assertion going
  ambiguous under a UI change (PR #20, see Metrics log note) — never a real
  implementation defect surfacing late in either case.
- **Catching the wrong-git-identity commit before the PR existed** (PR #20, Gap E) —
  amend + force-push on an unreviewed branch is cheap; the same fix after merge would not
  be. Worth normalizing a git-identity check into Phase 1 regardless (see Gap E) so this
  isn't relying on someone happening to notice `git log --format='%an'` looks wrong.
