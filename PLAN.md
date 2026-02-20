# ThrustCurves - Car Thrust Curve Web Application

## Context

Build a web app that generates thrust curves for cars using OEM specs (gearing, tire sizes, Cd, frontal area, HP/torque curves). Users can select stock cars, apply modifications, account for altitude, calculate performance metrics, and compare setups. Starting as a frontend-only SPA with the option to add a backend later.

## Tech Stack

- **React + Vite + TypeScript** (frontend-only SPA)
- **Recharts** for charts/graphs
- **Zustand** for state management (avoids Context re-render cascading)
- **IndexedDB** (via `idb` library) for persistent local storage
- **Bundled JSON** for OEM car database
- **Vitest** for unit testing
- **React Router** for client-side routing

## Project Structure

```
src/
├── main.tsx                        # Entry point
├── App.tsx                         # Root component + routing
│
├── data/
│   ├── cars.json                   # Bundled OEM car database
│   └── presets.ts                  # Altitude presets, default Crr, etc.
│
├── types/
│   ├── car.ts                      # CarSpec, EngineSpec, TransmissionSpec, TireSize, AeroSpec
│   ├── simulation.ts               # ThrustPoint, GearThrustCurve, EnvelopePoint, PerformanceResults
│   └── config.ts                   # CarModifications, SavedSetup, ComparisonSet
│
├── engine/                         # Pure TypeScript physics (zero React deps)
│   ├── drivetrain.ts               # Gear ratio, wheel torque, RPM<->speed conversions
│   ├── aerodynamics.ts             # Drag force calculation
│   ├── tires.ts                    # Tire radius from size string, rolling resistance
│   ├── altitude.ts                 # Air density model, NA/turbo power correction
│   ├── thrust.ts                   # Net thrust per gear, envelope curve, shift points
│   ├── performance.ts              # Numerical integration: 0-60, 1/4 mile, custom ranges
│   └── index.ts                    # Barrel export + runSimulation() convenience function
│
├── store/
│   ├── carStore.ts                 # Selected car + modifications
│   ├── simulationStore.ts          # Simulation results + comparison sets
│   └── persistenceStore.ts         # Saved configs, IndexedDB bridge
│
├── services/
│   ├── persistence.ts              # IndexedDB wrapper
│   └── carSearch.ts                # Search/filter over cars.json
│
├── hooks/
│   ├── useSimulation.ts            # Run simulation when inputs change
│   ├── useCarSearch.ts             # Debounced car search
│   └── useComparison.ts            # Manage comparison set
│
├── components/
│   ├── layout/                     # AppShell, Header, Sidebar
│   ├── car-selector/               # CarSearch, CarCard, CarSpecTable
│   ├── editor/                     # ModificationsPanel + all sub-editors
│   ├── charts/                     # ThrustCurveChart, PowerTorqueChart, AccelerationChart, ComparisonChart
│   ├── results/                    # PerformanceCard, ComparisonTable, ShiftPointsTable
│   └── saved/                      # SavedConfigsList, SaveLoadControls
│
├── pages/
│   ├── HomePage.tsx                # Car selector + recently saved
│   ├── SimulatorPage.tsx           # Main workspace: editor + charts + results
│   ├── ComparePage.tsx             # Side-by-side comparison view
│   └── SavedPage.tsx               # Saved configurations manager
│
└── utils/
    ├── units.ts                    # mph<->km/h, ft<->m, tire size parsing
    ├── interpolation.ts            # Linear interpolation for torque curves
    └── formatting.ts               # Number formatting helpers
```

## Key Data Models

### CarSpec (OEM car data)
- `id`, `make`, `model`, `year`, `trim`, `curbWeightKg`, `drivetrain` (FWD/RWD/AWD)
- `engine`: torqueCurve + powerCurve (at 200 RPM intervals, in Nm/kW), redline, idle, displacement, forcedInduction flag
- `transmission`: gearRatios[], finalDriveRatio, shiftTimeMs, drivetrainLoss fraction, type
- `tireSize`: widthMm, aspectRatio, rimDiameterIn
- `aero`: cd, frontalAreaM2

### CarModifications (user overrides layered on OEM)
- weightDeltaKg, torqueMultiplier, customTorqueCurve, gearRatioOverrides, finalDriveOverride, tireSizeOverride, cdOverride, frontalAreaOverride, forcedInductionOverride, shiftTimeOverride, drivetrainLossOverride

### SimulationResult (output)
- gearCurves (thrust per gear), envelope curve, shiftPoints, performance metrics (0-60, 1/4 mile, custom ranges), full time-step trace

## Physics Engine Design

All calculations use **SI units internally** (m, s, N, kg). Display conversion happens at the UI boundary.

### Core Formulas
- **Tire radius**: `rimDiameter/2 + (width * aspectRatio / 100) / 1000` (in meters)
- **Wheel torque**: `engineTorque * gearRatio * finalDrive * (1 - drivetrainLoss)`
- **Thrust force**: `wheelTorque / tireRadius`
- **Drag force**: `0.5 * Cd * frontalArea * airDensity * speed^2`
- **Rolling resistance**: `Crr * mass * g`
- **Net force**: `thrust - drag - rollingResistance`
- **Air density at altitude**: `1.225 * (1 - 2.25577e-5 * altitude)^5.25588`
- **NA power correction**: approximately `airDensity / 1.225` (~-3% per 1000ft)
- **Turbo power correction**: milder, ~-1% per 1000ft

### Numerical Integration
- Euler's method with dt = 0.01s (adequate accuracy for this use case)
- At each step: look up net force from envelope at current speed, compute a = F/m, update speed and distance
- During gear shifts: thrust = 0 for shift duration
- Extract metrics by scanning time-steps for speed/distance thresholds

### Key Design Decisions
- **Modification overlay pattern**: Mods stored separately from base CarSpec; merged via `applyModifications()` before simulation. Preserves OEM baseline, makes "reset to stock" trivial.
- **Pure TypeScript engine**: No React deps in `src/engine/`. Testable, portable to Web Worker or future backend.
- **Zustand over Context**: Selector-based subscriptions prevent unnecessary re-renders during frequent parameter tweaks.

## Implementation Phases

### Phase 1: Project Scaffold + Types
- `npm create vite@latest` with React + TypeScript template
- Install all dependencies (react-router-dom, recharts, zustand, idb, uuid, vitest)
- Set up Tailwind CSS (`tailwindcss`, `@tailwindcss/vite`)
- Set up path aliases, ESLint, Prettier
- Define all TypeScript interfaces in `src/types/`
- Create initial `cars.json` with 5 well-known cars (Supra 3.0, Mustang GT, M3, Civic Type R, C8 Corvette)
- Basic AppShell layout with React Router stub pages

### Phase 2: Physics Engine
- Implement all `src/engine/` modules with unit tests
- `tires.ts`, `aerodynamics.ts`, `altitude.ts`, `drivetrain.ts`
- `thrust.ts` (gear curves, envelope, shift points)
- `performance.ts` (numerical integration, metric extraction)
- `runSimulation()` top-level function
- Validate against known published 0-60 times as sanity check

### Phase 3a: Stores, Hooks + Car Selector
- Zustand stores (`carStore`, `simulationStore`)
- `useSimulation` hook (runs simulation reactively on input changes)
- `useCarSearch` hook (debounced search over cars.json)
- Car search and selection UI (CarSearch, CarCard, CarSpecTable)
- Wire up SimulatorPage scaffold with car selector in place

### Phase 3b: Charts + Results Display
- ThrustCurveChart (all gears + envelope, Recharts)
- PowerTorqueChart (HP/torque vs RPM)
- PerformanceCard (0-60, 1/4 mile results)
- ShiftPointsTable
- Integrate charts and results into SimulatorPage layout

### Phase 4: Modification Editor
- ModificationsPanel with all sub-editors:
  - TorqueCurveEditor (editable table + inline chart + multiplier)
  - GearRatioEditor, WeightEditor, TireSizeEditor, AeroEditor
  - AltitudeSelector with presets (sea level, Denver, Mexico City, etc.)
  - ForcedInductionToggle
- Apply modifications logic in store

### Phase 5: Save & Compare
- IndexedDB persistence layer
- Save/load/delete configurations
- SavedPage with config list
- ComparePage: select configs, overlay on ComparisonChart
- ComparisonTable with delta times

### Phase 6: Polish
- AccelerationChart (g-force vs speed)
- Custom speed range inputs
- Unit toggle (imperial/metric) throughout
- Responsive layout
- Expand car database to 15-20 cars
- Input validation and error boundaries

### Phase 7: Dyno Graph Reader (future/optional)
- Image upload + canvas overlay for axis calibration
- OCR or color-based curve tracing
- Map extracted points to 200 RPM intervals

## Dependencies

| Package | Purpose |
|---|---|
| `react`, `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `recharts` | Charts |
| `zustand` | State management |
| `idb` | IndexedDB wrapper |
| `uuid` | Unique IDs for saved configs |
| `vitest` | Unit testing |
| `@testing-library/react` | Component testing |
| `tailwindcss`, `@tailwindcss/vite` | Utility-first CSS styling |

## Verification
- Unit test all `src/engine/` modules against hand-calculated values
- Validate simulated 0-60 times against published specs for OEM cars (should be within ~0.5s)
- Test save/load/compare flow end-to-end in the browser
- Test altitude corrections produce reasonable power loss percentages
- Visual QA: thrust curves should show expected shapes (decreasing thrust per gear at higher speeds, gear crossover points)

---

## Future Work / Backlog

### Custom Car Builder

Allow users to create fully custom car entries by inputting all parameters themselves. This supports:
- Wild custom builds that don't map to any OEM template
- Hypothetical / fictional vehicles
- Tuner builds with exotic gear sets, swapped engines, etc.

**Phase A — Fully Custom Car (MVP)**

A "Create Custom Car" flow in the UI where the user inputs every field from scratch:
- Basic info: make, model, year, trim (free text), drivetrain (FWD/RWD/AWD)
- Engine: displacement, forced induction toggle, redline RPM, idle RPM, torque curve (editable table of [rpm, Nm] pairs), power curve (or derive from torque)
- Transmission: number of gears, individual gear ratios, final drive ratio, drivetrain loss %, shift time (ms), type (manual/automatic/dct)
- Tires: width (mm), aspect ratio, rim diameter (in)
- Aero: Cd, frontal area (m²)
- Curb weight (kg)

The custom car is stored in the same `CarSpec` shape as OEM cars and persisted to IndexedDB alongside saved setups. It appears in the car selector alongside OEM cars, clearly labeled "(Custom)".

**Phase B — Pre-loaded OEM Library with Full Coverage (Long-term)**

Pre-load a much larger OEM database (hundreds of cars across makes/years) so users can:
1. Browse and select any real car as a starting point
2. Simulate stock, then apply the Modifications panel to tune it
3. Optionally "fork" a car to save as a custom variant

This avoids needing to re-enter common specs from scratch for known vehicles.

**Implementation Notes**
- Custom cars need a distinct ID prefix (e.g., `custom-{uuid}`) to avoid collisions with OEM IDs
- The existing `CarSpec` type already has all needed fields — no schema changes required
- The Modifications panel already handles overrides on top of a base `CarSpec`, so custom cars work with the full mod/save/compare pipeline out of the box
- Torque curve editor: an add/remove row table with RPM and Nm columns; optionally auto-compute a power curve from torque × RPM / 9549
- Consider validation: redline must be >= max RPM in torque curve, gear ratios must be positive, etc.

---

### Car Spec Audit & Source Documentation

The current car data in `src/data/cars.json` was generated from approximate/recalled values and may contain inaccuracies in torque curves, gear ratios, aero coefficients, or weights. Each entry needs to be audited against authoritative sources.

**What to do:**

1. **Document sources** — For every car, identify and record where each spec came from:
   - Manufacturer press kits / owner's manuals (gear ratios, final drive, redline, weight)
   - Dynamometer data (torque/power curves — these are wheel numbers; ours are crank, so note which)
   - Published road tests (Car and Driver, Motor Trend, etc. for sanity-checking 0-60 times)
   - Aero coefficients: manufacturer Cd specs; frontal area often estimated from vehicle dimensions

2. **Audit each car** — Cross-check the following fields in particular:
   - Torque/power curve shape and peak values vs published specs
   - Gear ratios and final drive (these are easy to verify from service manuals)
   - Curb weight (trim level matters — use the specific trim listed)
   - Aero: Cd is often publicly available; frontal area less so and may need estimation

3. **Correct and commit** — Update any inaccurate entries with a comment citing the source in
   a companion `src/data/SOURCES.md` file (not inline in JSON).

**Known concerns (to investigate):**
- Some torque curves may be overly smooth / simplified rather than matching real dyno shapes
- A90 Supra top speed figure was reported as suspicious during testing
- Newly added cars (FR-S, BRZ, GR86, F-350) used approximated data and haven't been validated

**Suggested source priority:**
1. OEM service manuals and spec sheets (most authoritative for gearing/weight)
2. Published dyno pulls from reputable tuner shops for curve shapes
3. Car and Driver / Motor Trend specs for sanity-checking performance numbers
