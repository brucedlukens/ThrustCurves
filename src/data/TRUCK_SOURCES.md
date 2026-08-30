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
- **Lookback scope**: every family carries the generations on sale from 2016
  to the current entry (half-tons and HDs). Ram HD models from the MY2013
  towing refresh (not 2010) — same convention as the DS Ram 1500. A "90s
  icons" batch adds one classic generation per family: 9th-gen F-150
  (1992–96), OBS F-250/F-350 (1992–97), GMT400 C/K trucks (1500 1992–98, HD
  1992–2000), and 2nd-gen Ram (1500 1994–2001, HD 1994–2002).
- **90s naming/config conventions**: lookback generations reuse the modern
  family's make/model strings so the UI's generation selector groups them
  (a 1992 truck files under "F-250 Super Duty" / "Silverado/Sierra 2500HD" /
  make "Ram"); the generation label carries the real identity ("OBS
  (pre-Super Duty)", "GMT400 (C/K)", "2nd gen (BR)"). Half-ton baselines are
  extended-cab 4x4 (no 90s half-ton crew cabs existed); crew cab only where
  real (F-350, GM 3500). The 2nd-gen Ram 3500 pickup was DRW-only — modeled
  as the dually (extra dual-tire rolling drag not modeled). 90s ratings are
  the automatic-transmission calibrations, which often differed from the
  manuals'.

## Confidence summary by truck

| Truck | Strongest data | Weakest data |
|---|---|---|
| Ford F-150 (2021+) | Gear/axle ratios (2023 order guide), peaks | Curve shapes (constructed), Cd/area estimate, redlines (forum consensus) |
| Ford F-150 (2015–2020) | All hp/torque/rpm peaks + 6R80/10R80 ratios (Ford 2020 tech-spec PDF), axle sets per engine (Ford towing tables) | Cd 0.43/3.25 m² (no official figure — estimated slightly worse than 14th gen), curb weights (GVWR − payload from 2020 spec sheet, extrapolated back for pre-2018), curve shapes (constructed, no public dyno traces) |
| Ford F-250/F-350 (2023+) | Weights, ratios, axles — all from Ford's official 2026 Super Duty tech-spec PDF | Curve shapes, Cd/area estimate |
| Ford F-250/F-350 (2017–2022) | Outputs and axle sets (Ford 2017 towing-selector brochure), 10R140 ratios | Curb weights (no accessible per-engine Ford table; anchored to the 2023+ entries minus content deltas — lowest-confidence weights in the catalog), curve shapes |
| Ford F-250/F-350 (2011–2016) | Outputs, 6R140 ratios, axle sets (Ford 2013 factory tech-spec PDF) | Diesel governed rpm (no primary source; 3200 used for catalog consistency), curb weights (GVWR−payload + diesel premium estimate), curve shapes |
| GM 2500/3500HD K2XX (2015–2019) | Outputs, ratios, axles, tires, base curb weights — GM 2015/2016 spec sheets + real window stickers | L5P-era (2017–2019) axle/weight extrapolated from LML sheets; +45 kg mid-trim bump unsourced; curve shapes |
| Ram 2500/3500 4th gen (2013–2018) | FCA spec-sheet PDFs for every MY 2013–2018 + 2016 towing charts (outputs, 66RFE/68RFE/Aisin, axles, J2807 base weights) | Curb weights are base-trim J2807 figures (mid trim runs heavier), 2015 HO 865 lb-ft from a single trade-press source, curve shapes |
| GM 1500 (2019+) | Peaks (GM spec sheets), 10L80/90 ratios | 8L80 ratios (8L90-family proxy), weights (aggregators) |
| GM 1500 K2XX (2014–2018) | Outputs, 6L80/8L90 ratios, axles, weights — all from GM's printed 2015/2016 product-info spec sheets | Cd 0.43/3.4 m² (extrapolated from GM's "7% better" T1 claim), curves reused from the identical pre-DFM T1 engines |
| Ram 1500 DS (2013–2018) | FCA 2013/2014 spec + towing-chart PDFs (outputs, 8HP70 ratios, per-engine axle pairings) | Cd 0.43/3.43 m² (derived), curve shapes (HEMI reuses DT curve — same rating; EcoDiesel synthesized) |
| GM 2500/3500HD (2020+) | L5P figures, Allison/6L90 ratios | Gas & 3500 SRW weights (interpolated), Cd/area |
| Ram 1500 (2019+) | Official Stellantis spec/towing-chart PDFs (weights exact per config) | Curve shapes; HO Hurricane axle/gearing inferred from towing charts |
| Ram 2500/3500 (2019+) | Official Stellantis spec + body-builder PDFs (ratios, axles, weights) | Curve shapes, Cd/area |
| Toyota Tundra (2022+) | Toyota press-release figures; weight (Limited CrewMax spec) | AWR10L65 ratios (secondary listings), single 3.31 axle unconfirmed by order guide |
| Ford F-150 (1992–96) | 1994–96 brochure ratings, axle sets from the 1996 factory towing guide, E4OD ratios | Redlines (no factory figure anywhere — period-typical estimates), 5.8L curb weight (+40 kg estimate over the sourced 5.0L figure) |
| Ford F-250/F-350 OBS (1992–97) | E4OD ratios, IDI/Power Stroke ratings (diesel-community consensus, 2–3 sources each) | Nearly everything else is secondary-source consensus: gas curb weights (engine-mass-delta estimates), gas redlines, the contested 1996–97 Power Stroke uprate (launch 210/425 modeled) |
| GM 1500/HD GMT400 (1992–2000) | Engine ratings (multi-source consensus incl. GM crate-engine listings), 4L60-E/4L80-E ratios | 6.5L Turbo Diesel rating (genuinely conflicted sources; 190/385 auto figure modeled), all curb weights (forum scale reports, no factory sheet), 1500 axle set unconfirmed |
| Ram 1500/HD 2nd gen (1994–2002) | Cummins rating timeline (dieselhub), 42RE/44RE/46RE/47RE identification, Dana 3.54 axle code | 5.9L Magnum "HD" rating unverified, curb weights scaled from one Quad-Cab data point, HD axle sets assumed, dually tire size unconfirmed |

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
- **Super Duty 6.2L never left the 6-speed**: through the entire 2017–2022 run
  (2020 refresh included) the 6.2L stayed on the 6R140-based TorqShift-G; only
  the 7.3L and the diesel moved to the 10R140 in 2020. Ford's own 2013 factory
  spec PDF gives the 6R140 ratios as 3.97/2.31/1.51/1.14/0.85/0.67 — the
  commonly repeated 2.32/1.52/1.15/0.86 set is forum rounding (both gens use
  the factory figures here).
- **Super Duty SRW axle sets by era**: 2011–2016 diesel offered all of
  3.31/3.55/3.73/4.30 (3.31 standard); 2017–2022 SRW diesel narrowed to
  3.31/3.55 (F-350 SRW included — no 3.73). Gas is 3.73/4.30 in both eras, no
  3.55. 2011–2016 mid-trim trucks ran LT245/75R17 (18s/20s were upper-trim).
- **6.7L Power Stroke ladder**: 390/735 (MY2011 launch, reflashed free to
  400/800 within the year) → 440/860 (2015, single GT37 VGT) → 440/925 (2017)
  → 450/935 (2018) → 475/1050 (2020, 10R140) → 475/1050 SO + 500/1200 HO
  (2023+). No primary source states the older engines' governed speed; 3200
  rpm is used across the board for consistency.
- **K2XX HD (2015–2019)**: gas L96 SRW trucks are 4.10-axle-only (GM's
  general table lists 3.73 "or" 4.10, but every SRW trailering row and real
  window stickers show only 4.10 — 3.73 is a DRW row); diesel is 3.73-only.
  L96 max engine speed is 6000 rpm. Standard tires: LT245/75R17 (2500HD),
  LT265/70R18 (3500HD SRW). LML 2015–2016, L5P 445/910 2017–2019, both on the
  Allison 1000 6-speed.
- **4th-gen Ram HD (2013–2018)**: there is NO 850 lb-ft 3500 standard-output
  in this generation — the 68RFE Cummins is 370 hp / 800 lb-ft @ 1600 on both
  2500 and 3500 SRW (850 is a 2019+ rating). SRW diesels are 3.42-axle-only
  (3.73/4.10 are DRW-only). Gas 6.4L (2014+) uses the 66RFE — a 545RFE case
  with 68RFE-style gearing, so the ratio set matches the 68RFE. Aisin HO
  escalation: 850@1600 (2013–14) → 865@1700 (2015) → 900@1700 (2016–17) →
  930@1700 (2018, modeled). The 2018 FCA PDF's "1,220 N·m" parenthetical is a
  stale conversion of the prior 900 lb-ft rating; 1261 Nm is correct.
- **13th-gen F-150 mid-cycle updates**: the 10R80 10-speed launched with the
  2nd-gen 3.5L EcoBoost (375 hp / 470 lb-ft) for MY2017 only; the 2.7L
  EcoBoost (400 lb-ft) and 5.0L Coyote (395 hp, port+direct injection) moved
  to it for MY2018, when the 3.0L Power Stroke diesel was also added. Each
  spec version is modeled as its own powertrain entry with its year range.
  The Limited/Raptor HO 3.5L (450 hp) is excluded as trim-exclusive.

- **90s facts worth keeping** (all corrections researchers made to the
  briefs): the 9th-gen F-150 never offered 4.10 axles (3.08/3.55 only, per
  the 1996 factory towing guide) and its brochure ratings split by
  transmission (5.0L: 195 hp auto / 205 manual). The factory-turbo 7.3L IDI
  existed for 1993–94 only. GMT400 TBI 350 is 210 hp / 300 lb-ft @ 2800 (the
  often-quoted 255 hp "454" figure for 1994–95 is the 454SS street truck,
  not the HD calibration); GMT400 4x4 half-tons ran 245/75R16 (235/75R15 is
  2WD-only). The 5.2L Magnum used the light-duty 42RE/44RE its whole life,
  never the 46RE; Dana axle codes are 3.54/3.92/4.10 (3.55 is rounding). The
  12-valve Cummins automatic was rated 160/400 (1994–95) then 180/420
  (1996–98) — well under the manuals — and is governed at 2500 rpm, which
  leaves it unable to hold 65 mph with the mid travel trailer (3rd gear sits
  39 rpm past the governor, 4th is ~250 N short): the catalog-wide sweep
  test asserts 60 mph for this reason. The 24-valve automatic reached
  235/460 only in 2001–02 (modeled), and the 2001–02 HO 245/505 was
  manual-only (excluded).

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
- Same cross-generation treatment for the HD batch, enforced programmatically
  on every same-engine chain before insertion: the 2020–2022 7.3L Godzilla
  curve was clamped pointwise below the 2023+ (485 lb-ft) curve; the
  2017–2022 6.2L's 4600–5600 rpm range was lifted above the 405 lb-ft
  2011–2016 version (same 385 hp peak, still at 5750); the 2017–2019 Power
  Stroke's sub-1600-rpm spool was lifted to sit between the 2015 (860 lb-ft)
  and 2020 (1050 lb-ft) curves. Advertised peaks unchanged in all three.
  (The 2020–22 F-250 diesel can still edge the 2023 by ~0.1% max grade — it
  is a few kg lighter on a slightly taller tire, which is real.)
- 90s batch: the 2nd-gen 5.9L Magnum (245 hp @ 4000) curve's implied power
  peak landed at 4400 rpm; 3600–4200 rpm points lifted so 245 hp lands at
  the advertised 4000. Within-batch calibration chains (TBI→Vortec ×2,
  IDI→Power Stroke, 12v→24v Cummins) all validated without adjustment.

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
