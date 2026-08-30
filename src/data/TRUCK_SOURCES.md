# Truck & Trailer Data Sources (Towing page)

Companion to `SOURCES.md` (cars). Covers `trucks.json` and `trailers.ts`.
Researched 2026-08 via web fan-out, aggregated and validated programmatically
(peaks must land on advertised figures at the advertised rpm; implied power
P(kW) = T(Nm)·rpm/9549 must match advertised power within ~2%).

## Units and methodology

- **Torque curves**: crank Nm, ~200–400 rpm spacing. Anchored exactly to
  advertised peak torque/power at their advertised rpm. Between anchors the
  shape follows published dyno/manufacturer curve data where found, otherwise
  a realistic shape for the architecture (diesels: broad flat plateau; turbo
  gas: plateau then taper; NA V8: broad mid-range peak). Power curves in the
  app are derived from torque, guaranteeing consistency.
- **Curb weights**: crew cab, 4x4, standard/short bed, mid trim, per engine
  (the UI lets users override weight for other configs).
- **Gear ratios**: internal transmission ratios excluding axle; axle ratios
  listed are factory options per engine.
- **Model years**: each powertrain uses its most recent output figures as
  primary; year-range notes flag older calibrations.
- **v1 scope**: current generation only. Pre-2016 lookback generations are a
  planned follow-up (see TOWING_PLAN.md).

## Confidence summary by truck

| Truck | Strongest data | Weakest data |
|---|---|---|
| Ford F-150 (2021+) | Gear/axle ratios (2023 order guide), peaks | Curve shapes (constructed), Cd/area estimate, redlines (forum consensus) |
| Ford F-150 (2015–2020) | All hp/torque/rpm peaks + 6R80/10R80 ratios (Ford 2020 tech-spec PDF), axle sets per engine (Ford towing tables) | Cd 0.43/3.25 m² (no official figure — estimated slightly worse than 14th gen), curb weights (GVWR − payload from 2020 spec sheet, extrapolated back for pre-2018), curve shapes (constructed, no public dyno traces) |
| Ford F-250/F-350 (2023+) | Weights, ratios, axles — all from Ford's official 2026 Super Duty tech-spec PDF | Curve shapes, Cd/area estimate |
| GM 1500 (2019+) | Peaks (GM spec sheets), 10L80/90 ratios | 8L80 ratios (8L90-family proxy), weights (aggregators) |
| GM 1500 K2XX (2014–2018) | Outputs, 6L80/8L90 ratios, axles, weights — all from GM's printed 2015/2016 product-info spec sheets | Cd 0.43/3.4 m² (extrapolated from GM's "7% better" T1 claim), curves reused from the identical pre-DFM T1 engines |
| Ram 1500 DS (2013–2018) | FCA 2013/2014 spec + towing-chart PDFs (outputs, 8HP70 ratios, per-engine axle pairings) | Cd 0.43/3.43 m² (derived), curve shapes (HEMI reuses DT curve — same rating; EcoDiesel synthesized) |
| GM 2500/3500HD (2020+) | L5P figures, Allison/6L90 ratios | Gas & 3500 SRW weights (interpolated), Cd/area |
| Ram 1500 (2019+) | Official Stellantis spec/towing-chart PDFs (weights exact per config) | Curve shapes; HO Hurricane axle/gearing inferred from towing charts |
| Ram 2500/3500 (2019+) | Official Stellantis spec + body-builder PDFs (ratios, axles, weights) | Curve shapes, Cd/area |
| Toyota Tundra (2022+) | Toyota press-release figures; weight (Limited CrewMax spec) | AWR10L65 ratios (secondary listings), single 3.31 axle unconfirmed by order guide |

## Notable verified facts (commonly confused)

- **Ford 6.8L gas Super Duty uses the 10R100 TorqShift-G**, not the 10R140;
  only the 7.3L gas and both 6.7L Power Strokes use the 10R140. Super Duty SRW
  axles: gas 3.73/4.30, diesel 3.31/3.55 (verified in Ford's tech-spec PDF).
- **Ram HD**: the 6.4L HEMI has used the ZF 8HP75 in both 2500 and 3500
  pickups since 2019 (66RFE persisted only on chassis cabs). Cummins SO used
  the 68RFE through 2024; for 2025 the SO was discontinued and a single
  430 hp / 1075 lb-ft HO with the new ZF PowerLine 8-speed became standard on
  both trucks (3.42 axle). The Aisin AS69RC HO combo is kept as a separate
  "legacy" 3500 powertrain (2019–2024).
- **GM HD**: L8T gas ran the 6L90 6-speed 2020–2023, Allison-branded 10L1000
  from 2024 (modeled with the 10-speed); L5P Duramax has been 10L1000
  throughout, 3.42 axle only. 2024+ L5P figures (470 hp / 975 lb-ft) primary.
- **GM 1500 2.7L**: current TurboMax calibration (430 lb-ft) primary;
  2019–2021 made 348 lb-ft. It pairs with the 8-speed through 2026.
- **Ram 1500**: 8HP75 across 5.7 HEMI and both Hurricanes; Hurricane HO is
  3.92-axle-only per the towing charts.
- **Tundra non-hybrid** has a single 3.31 axle ratio; transmission is the
  Aisin AWR10L65 ("Direct Shift-10AT").
- **K2XX transmission availability**: the 6.2L got the 8L90 8-speed from
  MY2015 (6L80 in 2014 only, folded into a note); the 5.3L stayed on the 6L80
  as standard through 2018, with the 8L90 optional on higher trims from
  MY2016 — modeled as separate 6-spd and 8-spd entries. Per GM's spec sheets
  the 6.2L axle set is 3.23/3.42 only (a claimed 3.73 was rejected as
  conflicting with GM's own trailering figures).
- **DS Ram 1500 (2013–2018)**: the 1500's 6-speed is the 65RFE (66RFE is the
  HD box — the brief had this wrong); it's covered as a note since the 8HP70
  was the towing-focused default from MY2014. Per the official towing charts
  the 8-speed HEMI paired only with 3.21/3.92 (3.55 was 65RFE-only) and the
  EcoDiesel only with 3.55/3.92. MY2013 HEMI was rated 407 lb-ft; the
  2014–2018 410 lb-ft rating is modeled. The DS continued as the "1500
  Classic" through 2024. The DT-generation 3.0L EcoDiesel gen 3
  (2020–2022, 260 hp / 480 lb-ft) was also added to the existing DT entry;
  its official 5,800 rpm max engine speed is unusually high for a diesel but
  matches FCA's published figure.
- **13th-gen F-150 mid-cycle updates**: the 10R80 10-speed launched with the
  2nd-gen 3.5L EcoBoost (375 hp / 470 lb-ft) for MY2017 only; the 2.7L
  EcoBoost (400 lb-ft) and 5.0L Coyote (395 hp, port+direct injection) moved
  to it for MY2018, when the 3.0L Power Stroke diesel was also added. Each
  spec version is modeled as its own powertrain entry with its year range.
  The Limited/Raptor HO 3.5L (450 hp) is excluded as trim-exclusive.

## Corrections applied during aggregation

- 6.7L Power Stroke (standard output): research curve had a small
  non-monotonic kink at 2400 rpm ([2400, 1290] between 1340 and 1301);
  smoothed to [2400, 1320]. Peaks unchanged.
- Fuel values normalized (`gasoline` → `gas`).
- 2021 F-150 3.5L EcoBoost and 5.0L: the original constructed curves sagged
  to a flat midrange (~345 hp at 4200–5000 for the 3.5L) that fell below the
  weaker 13th-gen versions of the same engines — implausible for a
  higher-output calibration of the same hardware. Midrange points (3.5L
  4000–5800 rpm, 5.0L 4800–5800 rpm) lifted to a smooth power ramp so the
  newer calibration is ≥ its predecessor at every rpm; advertised torque and
  power peaks unchanged. (The 14th-gen 5.0 truck can still trail the 13th-gen
  slightly in towing metrics — it is ~135 kg heavier, which is real.)

## Simulation constants (choices made here, not researched)

- `TRUCK_DRIVETRAIN_LOSS = 0.15` crank→wheel for a 4x4 pickup (auto +
  transfer case + axle), consistent with the 0.12–0.15 range used for cars.
- `TRUCK_SHIFT_TIME_MS = 400` for truck automatics under load.
- Lugging floors for "usable gear" analysis: diesel 1000 rpm, gas 1250 rpm
  (locked-converter sustained pulling; below this a transmission downshifts).
- Aero for trucks is an estimate everywhere: OEMs publish Cd only for
  optimized 2WD configs (GM claimed 0.38, Ram 0.357); crew cab 4x4 values are
  bumped to 0.41–0.44 with frontal area from width × height × ~0.82–0.87 fill.

## Trailer presets and combined-drag model (`trailers.ts`)

Masses/dimensions from manufacturer specs (Kaufman, Forest River, Alliance
RV, cargo-trailer dealers). Standalone Cd values are engineering estimates by
shape class. Combined drag uses
`CdA_combined = CdA_truck + k · Cd_trailer · A_trailer` with per-category
interference factors k (0.25 utility … 0.75 large travel trailer; fifth
wheels lower than same-size bumper-pulls due to over-bed nose integration),
calibrated so combined-drag increases (~1.15× to ~4.2× the solo truck)
reproduce published wind-tunnel (+15.8% small trailer), CFD (system Cd 0.65
vs 0.43 solo), and A-B-A towing fuel-economy data. ST trailer tire
Crr = 0.013 (derived from NAS SR 286 passenger baselines + radial/bias
differential; no direct ST measurement exists — weakest number in the set).

Key sources: SAE 2017-01-1540 (yaw drag of vehicle-trailer combos),
researchgate wind-tunnel truck+trailer study, thecalibertech.com CFD towing
analysis, lightshiprv.com aero writeups, nationalacademies.org SR 286.

## Known simplifications

- eTorque/hybrid electric assist not modeled; PowerBoost and i-FORCE MAX
  deferred entirely.
- Diesel low-gear torque management (in-gear derate) ignored — full curve in
  every gear.
- Torque converter assumed locked (steady-state analysis ≥ ~15 mph).
- No thermal derate, no official tow ratings — theoretical comparison only.
- Tongue-weight transfer between trailer and truck axles ignored for rolling
  resistance (second-order).
