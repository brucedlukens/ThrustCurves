# Towing Comparison Feature — Plan & Progress Checkpoint

> **Purpose of this file:** working plan AND resumption checkpoint. If a session runs out
> of tokens, a fresh session should read this file top-to-bottom and continue from the
> first unchecked item in "Progress". Update the Progress section as chunks complete.

## Feature summary

New "Towing" section of the app: compare multiple US pickup trucks (half/3-4/1-ton) in a
shared towing scenario (trailer type + weight, altitude, grade %, target speed) and see:

1. **Per-gear analysis table** (core): for each selected truck, every gear usable at the
   target speed — RPM in that gear, thrust/power available, and the surplus or deficit
   (in hp and lb-ft equivalent at the wheels) vs. what's required to hold speed.
2. **Thrust vs. road-load chart**: per-gear thrust curves overlaid with the required-force
   line for the scenario; gap visible at all speeds.
3. **Max sustainable speed on grade**: fastest steady speed on the scenario grade, with
   gear/RPM where it occurs.
4. **Max grade at speed**: steepest grade holdable at target speed. "Best gear" for
   headline display = the HIGHEST gear (lowest RPM) that can hold the scenario
   (user-specified definition); also show per-gear max grade. Flat ground = 0% grade.
5. **Passing acceleration while towing**: 40–60 mph (and similar) with combined mass/drag.

User decisions (from kickoff Q&A, 2026-08-29):
- Truck config baseline: **crew cab, standard/short bed, 4x4** per truck, with an
  editable curb-weight override field for other configs.
- All four extra output views wanted in v1.
- Scope v1: **current-generation trucks only**; previous gens back to 2016 come later.
- No official tow ratings, no thermal derate — theoretical comparison only.
- Steady-state assumption (locked torque converter); launching/converter multiplication
  out of scope.
- Hybrids (PowerBoost, i-FORCE MAX) deferred past v1 (electric assist curve modeling).

## Truck matrix (v1 = current generation)

| Truck | Gen/years | Powertrains (v1) |
|---|---|---|
| Ford F-150 | 14th gen 2021+ | 2.7 EcoBoost, 3.5 EcoBoost, 5.0 V8 (10R80 10-spd) |
| Ford F-250 | 2023+ | 6.8 gas, 7.3 gas, 6.7 PSD, 6.7 PSD HO (10-spd TorqShift) |
| Ford F-350 SRW | 2023+ | same as F-250, heavier |
| Chevy/GMC 1500 | T1 2019+ (2022 refresh) | 2.7 TurboMax, 5.3 V8, 6.2 V8, 3.0 Duramax LZ0 |
| Chevy/GMC 2500HD | 2020+ (2024 refresh) | 6.6 gas L8T, 6.6 Duramax L5P (Allison 10-spd) |
| Chevy/GMC 3500HD SRW | same | same, heavier |
| Ram 1500 | DT 2019+ | 5.7 Hemi (≤2024), 3.0 Hurricane SO+HO (2025+) |
| Ram 2500 | 2019+ | 6.4 Hemi, 6.7 Cummins (+ 2025 update w/ new 8-spd) |
| Ram 3500 SRW | 2019+ | 6.4 Hemi, 6.7 Cummins HO |
| Toyota Tundra | XK70 2022+ | 3.4TT i-FORCE (10-spd) |

Per powertrain we need: crank torque+power curves (~200–400 rpm steps, Nm/kW), redline,
idle, displacement, forced induction, transmission gear ratios + type, **available axle
ratios** (user picks one), curb weight (crew cab 4x4 std bed w/ that engine, kg), typical
tire size. Per truck: Cd + frontal area. Same units/methodology as `src/data/SOURCES.md`.

## Architecture

- **Data**: new `src/data/trucks.json` (schema: `TruckModel` → `powertrains[]` →
  `axleRatios[]`), `src/data/trailers.ts` (trailer presets), `src/data/TRUCK_SOURCES.md`
  (audit doc mirroring SOURCES.md). Trucks resolve to the existing `CarSpec` via
  `resolveTruckToCarSpec()` so the whole existing engine works unchanged.
- **Types**: `src/types/truck.ts` (TruckModel, TruckPowertrain, TrailerSpec,
  TowScenario, TowingSelection), extend as needed.
- **Engine**: `src/engine/towing.ts` —
  - `towingRoadLoadN(massKg, speedMs, cdA, rho, crr, gradePercent)` = ½ρ·CdA·v² +
    m·g·Crr·cosθ + m·g·sinθ
  - combined CdA: truck CdA + trailer exposed CdA × interference factor (from research)
  - per-gear usable check: RPM within [lugging floor, redline]; surplus = thrust −
    road load, reported as hp at speed (P = F·v)
  - `maxSustainableSpeedOnGrade` (bisection on envelope vs road load)
  - `maxGradePerGearAtSpeed` (solve m·g·(sinθ + Crr·cosθ) = F_thrust − F_aero)
  - passing accel: reuse existing acceleration integration with combined mass + CdA
- **UI**: `src/pages/TowingPage.tsx` + `src/components/towing/*`. Route + nav entry.
  Scenario panel (trailer preset, weight, extra-tall toggle, cargo, altitude, grade,
  speed, units imperial-first) + truck cards (model → year/engine → axle ratio →
  weight override) + the 5 result views.

## Research fan-out (Sonnet subagents, WebSearch)

One agent per truck family + one for trailers/aero. Each returns JSON matching the
schema above + sources + confidence notes, and writes a backup copy to scratchpad.
Aggregation + audit done by main session into trucks.json / TRUCK_SOURCES.md.

Trailer/aero agent: typical weights + frontal areas + Cd for flatbed (empty/with car),
enclosed cargo (std/tall), travel trailer, 5th wheel; trailer tire Crr (ST tires);
literature interference/shielding factors for truck+trailer combined drag.

## Progress

- [x] Kickoff Q&A, decisions recorded above
- [x] Worktree `../ThrustCurves-towing` on branch `feature/towing-comparison`
- [x] Research agents launched (8: F-150, Super Duty, GM 1500, GM HD, Ram 1500, Ram HD, Tundra, trailers/aero).
      Results land in scratchpad `research/*.json` (session-specific; re-run agents if lost)
- [x] Research received: ALL 8 agents (F-150 included)
- [x] Aggregation → `src/data/trucks.json` (10 trucks, 27 powertrains), `src/data/trailers.ts`
- [x] `src/data/TRUCK_SOURCES.md` audit/provenance doc
- [x] Types (`src/types/truck.ts`)
- [x] Engine (`src/engine/towing.ts` + `performance.ts` grade/initialSpeed/stopAt extensions) + tests green
- [x] `resolveTruckToCarSpec` + data tests (all 24 powertrain combos produce sane analyses)
- [x] TowingPage UI (ScenarioPanel, TruckPicker, TowingChart, summary + gear tables) + route/nav + tests
- [x] Full suite green: 289 tests, lint clean, build OK
- [ ] `resolveTruckToCarSpec` + tests
- [ ] TowingPage UI + components + route/nav
- [x] frontend-ci agent passes in worktree
- [x] Pre-flight lint + build
- [x] PR created (https://github.com/brucedlukens/ThrustCurves/pull/19), remote CI green (Build/Lint/Test)
- [x] Introspection run (process docs + .claude/memory/MEMORY.md updated on this branch)
- [ ] Manual testing by user (npm run dev in the worktree → /towing), then merge + worktree cleanup
- [ ] (LATER, separate effort) previous-generation lookbacks to 2016
