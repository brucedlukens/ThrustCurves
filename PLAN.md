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
