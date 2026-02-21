# Car Data Sources and Audit Log

## Data Units and Methodology

All entries in `cars.json` use:

- **Torque**: Newton-metres (Nm) at the **crankshaft**
- **Power**: Kilowatts (kW) at the **crankshaft**
- **Weight**: Kilograms (kg), curb weight (unladen, fluids full, no driver)
- **Gear ratios**: Internal transmission ratios (not including final drive)
- **Final drive ratio**: Overall axle/transaxle ratio (ring-and-pinion, or combined ratio for transaxle designs)

Torque and power curves are based on manufacturer published peak values with curve shapes derived from published dyno data, manufacturer specifications, and automotive reference databases. These are **crank values**, not wheel values. Dyno pulls typically measure at the wheels; add ~8–15% for drivetrain losses to compare to our numbers.

## Source Priority

1. OEM press kits, service manuals, and technical specification sheets (gear ratios, weight, redline)
2. Transmission OEM data (ZF, Tremec, BorgWarner) for gear ratios
3. Published performance databases (automobile-catalog.com, ultimatespecs.com, carfolio.com)
4. Automotive journalism (Car and Driver, Motor Trend) for sanity-checking performance numbers
5. Enthusiast forums and service manual excerpts for gear ratios and niche specs

## Audit Pass: February 2026

This audit corrected **7 cars** with confirmed errors (gear ratios, torque/power curves).
The remaining 12 cars are approximately correct within simulation tolerance.

---

## Per-Car Audit

### Toyota Supra 2020 (3.0 Premium) — `toyota-supra-2020`

| Field | JSON | Actual | Status |
|-------|------|--------|--------|
| Gear ratios | [5.000, 3.200, 2.143, 1.720, 1.314, 1.000, 0.822, 0.640] | ZF 8HP76: same | ✅ Confirmed |
| Final drive | 3.46 | 3.46 | ✅ Correct |
| Peak torque | 499 Nm | 500 Nm (369 lb-ft) | ✅ Correct (−0.2%) |
| Peak power | 248 kW | 250 kW (335 hp) at 5000–6500 rpm | ✅ Correct (−0.8%) |
| Curb weight | 1565 kg | 1565 kg (USDM 3.0 Premium) | ✅ Confirmed |

**Sources**: Toyota press kit; ZF 8HP76 transmission data
**Status**: Correct. Gear ratios confirmed via ZF 8HP76 data (same transmission used in BMW Z4 M40i).

---

### Ford Mustang GT 2024 — `ford-mustang-gt-2024`

| Field | JSON | Actual | Status |
|-------|------|--------|--------|
| Gear ratios | [4.696, 2.987, 2.14, 1.671, 1.285, 1.000, 0.839, 0.667, 0.617, 0.588] | Ford 10R80: 4.695, 2.988, 2.142, 1.670, 1.285, 1.000, 0.843, 0.667, 0.617, 0.588 | ✅ ~Correct |
| Final drive | 3.15 | 3.15 (base, no PP) | ✅ Correct |
| Peak torque | 569 Nm | 569 Nm (420 lb-ft) at 4000–5500 rpm | ✅ Correct |
| Peak power | ~334 kW | 358 kW (480 hp) at 7000 rpm | ⚠️ ~7% low |
| Curb weight | 1840 kg | 1840 kg (GT auto) | ✅ Confirmed |

**Sources**: Ford 2024 Mustang technical specifications (media.ford.com); 10R80 transmission data
**Status**: Gear ratios approximately correct (rounding differences). Power curve approximately 7% below published spec; curve shape is realistic. Not corrected — within simulation tolerance for a performance overview app.

---

### BMW M3 Competition 2021 — `bmw-m3-competition-2021`

| Field | Old JSON | Corrected | Note |
|-------|----------|-----------|------|
| Gear ratios | [5.0, 3.2, 2.143, 1.72, 1.314, 1.0, 0.822, 0.64] | [4.714, 3.143, 2.106, 1.667, 1.285, 1.000, 0.839, 0.667] | Was using ZF 8HP76 (Supra's trans) |
| Final drive | 3.85 | 3.85 | ✅ Correct |
| Peak torque | 650 Nm | 650 Nm (479 lb-ft) at 2650–5870 rpm | ✅ Correct |
| Peak power | ~374 kW | 375 kW (503 hp) at 7200 rpm | ✅ Correct |

**Sources**: BMW M3 G80 specification guide; ZF 8HP90 gear ratio data (gearboxlist.com)
**Correction**: Gear ratios updated from ZF 8HP76 ratios (used in A90 Supra) to ZF 8HP90 ratios (used in G80 M3 M Steptronic). First gear changed from 5.000 to 4.714; all other gears adjusted accordingly.

---

### Honda Civic Type R 2023 — `honda-civic-type-r-2023`

| Field | JSON | Actual | Status |
|-------|------|--------|--------|
| Peak torque | 420 Nm | 420 Nm (310 lb-ft) at 2600–4000 rpm | ✅ Correct |
| Peak power | ~228 kW | 235 kW (315 hp) at 6500 rpm | ✅ ~Correct (−3%) |
| Gear ratios | [3.636, 2.105, 1.458, 1.107, 0.848, 0.666] | Honda 6MT Helical LSD | ✅ Approximately correct |
| Curb weight | 1429 kg | 1432 kg | ✅ ~Correct |

**Sources**: Honda Type R press kit; ultimatespecs.com
**Status**: Approximately correct.

---

### Chevrolet Corvette C8 2020 (Stingray) — `chevrolet-corvette-c8-2020`

| Field | Old JSON | Corrected | Note |
|-------|----------|-----------|------|
| Gear ratios | [4.06, 2.57, 1.80, 1.39, 1.16, 0.86, 0.67, 0.57] | [2.91, 1.76, 1.22, 0.88, 0.65, 0.51, 0.40, 0.33] | Completely wrong |
| Final drive | 2.77 | 4.89 | Completely wrong |
| Peak torque | 637 Nm | ~637 Nm (470 lb-ft) at 5000 rpm | ✅ Correct |
| Peak power | ~369 kW | ~369 kW (495 hp) at 6450 rpm | ✅ Correct |

**Sources**: Tremec TR-9080 SAE paper; CorvetteForum technical thread (ring/pinion 3.55 × transfer gear 1.38 = 4.899 overall); automobile-catalog.com
**Notes**: The C8 uses a mid-mounted Tremec TR-9080 DCT with a unique two-stage final drive (ring-and-pinion × transfer gear). The "finalDriveRatio" in the JSON now represents the combined overall ratio (4.89). The base model uses "B" gearing; Z51 uses different ratios with 5.17:1 overall final drive.
**Correction**: All 8 gear ratios and final drive completely replaced.

---

### Porsche 911 Carrera S 2020 (992) — `porsche-911-carrera-s-2020`

| Field | Old JSON | Corrected | Note |
|-------|----------|-----------|------|
| Gear ratios | [4.05, 2.36, 1.63, 1.22, 0.99, 0.78, 0.62, 0.49] | [4.89, 3.17, 2.15, 1.56, 1.18, 0.94, 0.76, 0.61] | Completely wrong |
| Final drive | 3.44 | 3.39 | Slightly off |
| Peak torque | 450 Nm | 530 Nm (391 lb-ft) at 2300–5000 rpm | 15% too low |
| Peak power | ~294 kW | 331 kW (450 PS / 443 hp) at 6500 rpm | 11% too low |

**Sources**: Porsche 2020 911 Carrera S US specifications (newsroom.porsche.com); Rennlist forum PDK ratio data
**Correction**: All 8 PDK gear ratios, final drive, peak torque (530 Nm), and peak power (331 kW) corrected. Torque and power curves completely rebuilt.

---

### BMW M5 Competition 2021 — `bmw-m5-competition-2021`

| Field | JSON | Actual | Status |
|-------|------|--------|--------|
| Gear ratios | [4.72, 3.14, 2.11, 1.67, 1.28, 1.0, 0.82, 0.64] | ZF 8HP90: 4.714, 3.143, 2.106, 1.667, 1.285, 1.000, 0.839, 0.667 | ✅ ~Correct (rounding) |
| Final drive | 3.15 | 3.15 | ✅ Correct |
| Peak torque | 750 Nm | 750 Nm (553 lb-ft) at 1800–5600 rpm | ✅ Correct |
| Peak power | ~462 kW | 460 kW (617 hp) at 6000 rpm | ✅ Correct |

**Sources**: BMW M5 F90 Competition specifications; ZF 8HP90 transmission data
**Status**: Approximately correct.

---

### Dodge Challenger SRT Hellcat 2021 — `dodge-challenger-hellcat-2021`

| Field | Old JSON | Corrected | Note |
|-------|----------|-----------|------|
| Gear ratios | [3.59, 2.19, 1.41, 1.00, 0.84, 0.67, 0.59, 0.48] | [4.71, 3.14, 2.10, 1.67, 1.29, 1.00, 0.84, 0.67] | Completely wrong |
| Final drive | 2.62 | 2.62 | ✅ Correct |
| Peak torque | 881 Nm | 881 Nm (650 lb-ft) at 4800 rpm | ✅ Correct |
| Peak power | ~535 kW | 535 kW (717 hp) at 6200 rpm | ✅ Correct |

**Sources**: Dodge/Stellantis media release; TorqueFlite 8HP70 gear ratio data (challengertalk.com forum + Stellantis media)
**Correction**: All 8 TorqueFlite gear ratios replaced. The previous ratios were missing the first 3 true gears — old gears 1–5 were actually gears 4–8 of the actual transmission. Final drive (2.62) was already correct.

---

### Honda S2000 2006 (AP2) — `honda-s2000-2006`

| Field | Old JSON | Corrected | Note |
|-------|----------|-----------|------|
| Torque curve | peaked at 237 Nm at 7200 rpm | 220 Nm at 6800 rpm | Rebuilt |
| Power curve | peaked at 91 kW at 7400 rpm | 177 kW at 7800 rpm | ~50% of actual — major error |
| Gear 5 | 0.97 | 0.942 | Wrong |
| Gear 6 | 0.81 | 0.763 | Wrong |
| Final drive | 4.10 | 4.10 | ✅ Correct |
| Gears 1–4 | [3.13, 2.05, 1.48, 1.16] | [3.133, 2.045, 1.481, 1.161] | ✅ Correct (rounding) |

**Sources**: Honda S2000 AP2 official specs (240 hp at 7800 rpm, 162 lb-ft at 6800 rpm); AP2 transmission ratios from S2000 forums and s2000.club spec page; F22C1 engine data
**Correction**: Torque and power curves completely rebuilt to reflect F22C1 characteristics (smooth DOHC VTEC curve, no torque spike, power plateau 7200–7800 rpm). Gears 5 and 6 corrected.
**Notes**: Original data had power at approximately 50% of actual output — a significant error. Curb weight retained at 1270 kg (JDM spec; USDM was approximately 1286 kg).

---

### Subaru WRX STI 2021 — `subaru-wrx-sti-2021`

| Field | JSON | Actual | Status |
|-------|------|--------|--------|
| Peak torque | 407 Nm | 393 Nm (290 lb-ft) | ⚠️ ~3.5% high |
| Peak power | ~228 kW | 231 kW (310 hp) | ✅ ~Correct |
| Final drive | 3.90 | 3.90 | ✅ Correct |
| Curb weight | 1552 kg | ~1564 kg | ✅ ~Correct |

**Sources**: Subaru 2021 WRX STI official specifications (media.subaru.com)
**Status**: Torque slightly overstated (407 vs 393 Nm). Within simulation tolerance; not corrected.

---

### Nissan GT-R R35 2020 (Premium) — `nissan-gtr-r35-2020`

| Field | JSON | Actual | Status |
|-------|------|--------|--------|
| Peak torque | 637 Nm | 632 Nm (466 lb-ft) at 3300 rpm | ✅ ~Correct (+0.8%) |
| Peak power | ~427 kW | 419 kW (565 hp) at 6800 rpm | ✅ ~Correct (+2%) |
| Transmission | GR6 DCT (6 ratios) | GR6 BorgWarner DCT | ✅ Correct |

**Sources**: 2020 Nissan GT-R Premium specifications (carexpert.com.au); automobile-catalog.com
**Status**: Approximately correct.

---

### Tesla Model 3 Performance 2023 (Dual Motor) — `tesla-model3-performance-2023`

| Field | JSON | Actual | Status |
|-------|------|--------|--------|
| Peak power | 336 kW | 336 kW (450 hp) | ✅ Correct |
| Peak torque | 660 Nm | Combined dual-motor torque | ✅ Approximately correct |
| "RPM" range | 500–20000 | Electric motor RPM range | ✅ Reasonable |

**Sources**: Tesla Model 3 Performance 2023 specifications
**Notes**: Electric vehicle modeled with a single "gear" and high-RPM range representing motor speed. Flat power band from ~6000 RPM onward reflects real EV torque-limited behavior. Combined front+rear motor torque of 660 Nm is an approximation; Tesla does not publish individual motor torque curves.
**Status**: Approximately correct for simulation purposes.

---

### Mazda MX-5 Miata 2021 RF (ND2) — `mazda-mx5-miata-2021`

| Field | JSON | Actual | Status |
|-------|------|--------|--------|
| Peak torque | 205 Nm | 205 Nm (151 lb-ft) at 4000 rpm | ✅ Correct |
| Peak power | ~136 kW | 135 kW (181 hp) at 7000 rpm | ✅ Correct |
| Curb weight | 1048 kg | 1048 kg (RF Grand Touring) | ✅ Confirmed |

**Sources**: Mazda MX-5 ND2 specifications; ultimatespecs.com
**Status**: Correct.

---

### Chevrolet Camaro SS 2023 — `chevrolet-camaro-ss-2023`

| Field | JSON | Actual | Status |
|-------|------|--------|--------|
| Peak torque | 617 Nm | 617 Nm (455 lb-ft) at 4400 rpm | ✅ Correct |
| Peak power | ~342 kW | 339 kW (455 hp) at 5800 rpm | ✅ ~Correct |
| Gear ratios | 10-speed | Camaro SS 10-speed M5T/10L80 | ✅ Approximately correct |

**Sources**: Chevrolet Camaro SS 2023 specifications
**Status**: Approximately correct.

---

### Volkswagen Golf R 2022 (Mk8) — `volkswagen-golf-r-2022`

| Field | JSON | Actual | Status |
|-------|------|--------|--------|
| Peak torque | 420 Nm | 420 Nm (310 lb-ft) at 2100–5350 rpm | ✅ Correct |
| Peak power | ~235 kW | 235 kW (315 hp) at 5000–6500 rpm | ✅ Correct |
| Transmission | DQ381 7-speed DSG | DQ381-7A wet DSG | ✅ Correct |

**Sources**: VW Golf R Mk8 2022 technical specifications (media.vw.com); DQ381 transmission data
**Status**: Correct.

---

### Scion FR-S 2013 — `scion-frs-2013`

| Field | JSON | Actual | Status |
|-------|------|--------|--------|
| Peak torque | 205 Nm | 205 Nm (151 lb-ft) at 6400–6600 rpm | ✅ Correct |
| Peak power | ~144 kW | 147 kW (197 hp) at 7000 rpm | ✅ ~Correct (−2%) |
| Gear ratios | [3.626, 2.188, 1.541, 1.213, 1.000, 0.767] | FA20 6MT: confirmed | ✅ Confirmed |
| Final drive | 4.100 | 4.100 | ✅ Confirmed |
| Curb weight | 1213 kg | ~1247 kg (MT) | ⚠️ ~3% light |

**Sources**: Scion FR-S (ZN6) technical specifications; FA20 transmission data; FT86Club forum
**Status**: Gear ratios and torque confirmed. Curb weight slightly underestimated (1213 vs ~1247 kg).

---

### Subaru BRZ 2018 (Limited) — `subaru-brz-2018`

| Field | JSON | Actual | Status |
|-------|------|--------|--------|
| Peak torque | 212 Nm | 212 Nm (156 lb-ft) at 6400–6700 rpm | ✅ Correct |
| Peak power | ~147 kW | 153 kW (205 hp) at 7000 rpm | ✅ ~Correct (−4%) |
| Gear ratios | [3.636, 2.375, 1.761, 1.346, 1.000, 0.767] | FA20 6MT (ZN6/ZC6): confirmed | ✅ Confirmed |
| Final drive | 3.900 | 3.900 (2013–2020 BRZ 6MT) | ✅ Confirmed |

**Sources**: Subaru BRZ ZC6 technical specifications; FT86Club forum
**Status**: Approximately correct.

---

### Toyota GR86 2022 (Premium) — `toyota-gr86-2022`

| Field | Old JSON | Corrected | Note |
|-------|----------|-----------|------|
| Final drive | 4.300 | 3.583 | Was using 2022 BRZ's FDR |
| Peak torque | 250 Nm at 3500 rpm | 250 Nm at 3700 rpm | Curve rebuilt |
| Peak power | ~140 kW at 6500 rpm | 170 kW (228 hp) at 7000 rpm | ~18% too low — major error |
| Gear ratios | [3.540, 2.130, 1.517, 1.183, 1.000, 0.767] | (retained) | Plausible per forum data |

**Sources**: Toyota GR86 UK technical specifications (media.toyota.co.uk); Toyota GR86 Forum gearing thread; GR86/BRZ comparison data
**Correction**: Final drive corrected from 4.300 (2022 Subaru BRZ value) to 3.583 (GR86 MT). The GR86 uses taller gearing than the BRZ for the same platform. Torque and power curves completely rebuilt to reflect FA24 engine characteristics: broad flat torque plateau, 250 Nm peak at 3700 rpm, 170 kW peak at 7000 rpm.

---

### Ford F-350 2025 (Platinum 6.7L Diesel) — `ford-f350-diesel-2025`

| Field | Old JSON | Corrected | Note |
|-------|----------|-----------|------|
| Peak torque | 1424 Nm at 1800 rpm | 1627 Nm at 1800 rpm | Was standard output spec |
| Peak power | 373 kW at 2800 rpm | 373 kW at 2800 rpm | ✅ Already correct |

**Sources**: Ford 2025 Super Duty specifications; Ford Power Stroke 6.7L engine data (dieselhub.com)
**Correction**: For 2025, the F-350 drops the standard-output 6.7L diesel — the Platinum trim uses only the High Output variant (500 hp / 1200 lb-ft). Previous torque curve reflected the discontinued standard output (475 hp / 1050 lb-ft = 1424 Nm). Peak power was already correct at 373 kW (500 hp). Torque curve rebuilt for HO spec.

---

### Tesla Model S Plaid 2025 — `tesla-model-s-plaid-2025`

**EV modeling note**: Electric motors have maximum torque available from 0 RPM. The "RPM" axis represents motor shaft RPM. The simulation models the tri-motor AWD system as a single effective motor with a 9.73:1 combined reduction ratio (front motors ~14:1, rear ~9.05:1 — effective combined single-shaft equivalent). `gearRatios: [1.0]` with `finalDriveRatio: 9.73` encodes the full reduction. `forcedInduction: true` minimizes the sim's altitude power correction (EVs are essentially altitude-independent). `drivetrainLoss: 0.08` reflects EV efficiency (~92%).

| Field | Value | Source |
|-------|-------|--------|
| Curb weight | 2162 kg (4,766 lb) | Tesla Model S Plaid spec sheet |
| Peak torque | 1,050 Nm (774 lb-ft) | Tesla official spec; NHTSA CAFE data |
| Peak power | 760 kW (1,020 hp) | Tesla official spec |
| Torque base speed | 6,900 RPM (motor) | Derived: P/τ = 760,000/1,050 = 724 rad/s |
| Combined reduction ratio | 9.73:1 | EV database; derived from top speed 249 km/h |
| Top speed | 249 km/h (155 mph, electronic limit) | Tesla spec |
| Cd | 0.208 | Tesla official (lowest Cd of any production sedan at time of launch) |
| Frontal area | 2.39 m² | Estimated from vehicle cross-section dimensions |
| Tire size | 265/35R21 | Tesla Model S Plaid standard fitment |

**Sources**: Tesla Model S Plaid technical specifications (tesla.com/models); NHTSA CAFE compliance data; Top Gear / Car and Driver review data for 0–60 validation.
**Status**: New entry. Torque/power curves derived from published peak specs using ideal flat-torque / constant-power EV motor model. Validated: sim 0–60 ≈ 2.2–2.3 s vs Tesla's claimed 1.99 s (with rollout and launch control); within acceptable margin for a physics sim without traction-limit modeling.

---

### Porsche Taycan Turbo GT (Weissach Package) 2025 — `porsche-taycan-turbo-gt-weissach-2025`

**EV modeling note**: The Taycan Turbo GT uses a 2-speed rear gearbox + single-speed front motor. The simulation models this as a single-speed system: `gearRatios: [1.0]` with `finalDriveRatio: 8.05` (rear high-gear total ratio). The 1,340 Nm is Porsche's published combined system torque (overboost), treated as the effective motor torque at this reduction ratio. Combined torque at the wheels in the sim ≈ 9,700 Nm, yielding ~0–60 in 2.2–2.3 s vs Porsche's 2.2 s claim.

| Field | Value | Source |
|-------|-------|--------|
| Curb weight | 2,270 kg (5,004 lb) | Porsche Taycan Turbo GT spec sheet (Weissach −75 kg option considered) |
| Peak torque | 1,340 Nm (988 lb-ft) — overboost | Porsche official spec |
| Peak power | 815 kW (1,093 hp) — overboost | Porsche official spec |
| Torque base speed | 5,800 RPM (effective motor) | Derived: P/τ = 815,000/1,340 = 609 rad/s |
| Rear high-gear reduction | 8.05:1 total | Porsche engineering press documentation |
| Top speed | 305 km/h (190 mph) | Porsche official spec |
| Cd | 0.31 | Porsche Taycan aerodynamics documentation |
| Frontal area | 2.33 m² | Porsche technical data sheet |
| Tire size | 305/30R21 (rear) | Porsche Taycan Turbo GT standard fitment |

**Sources**: Porsche AG newsroom (newsroom.porsche.com); Porsche Taycan Turbo GT technical data sheet; Car and Driver / Evo magazine performance figures.
**Status**: New entry. Modeled as single-speed EV due to simulation architecture constraints. The 2-speed rear gearbox is not explicitly represented but its high-gear ratio (8.05:1 total) determines the RPM-to-speed mapping, which is correct for steady-state and full-acceleration scenarios. At launch, real-world performance is traction-limited; our sim without traction modeling will show slightly faster 0–60 than published.

---

### Chevrolet Corvette Z06 2003 (C5) — `chevrolet-corvette-z06-2003`

| Field | Value | Source |
|-------|-------|--------|
| Curb weight | 1,414 kg (3,118 lb) | GM press kit; Car and Driver long-term test |
| Engine | LS6 5.7L V8, naturally aspirated | GM powertrain documentation |
| Peak torque | 542 Nm (400 lb-ft) at 4,800 rpm | GM official spec |
| Peak power | 302 kW (405 hp) at 6,000 rpm | GM official spec |
| Gear ratios (T-56) | [2.97, 2.07, 1.43, 1.00, 0.84, 0.56] | Tremec T-56 service manual; Corvette Forum documentation |
| Final drive | 3.42:1 | GM engineering documentation (standard Z06 rear axle) |
| Top speed | 270 km/h (168 mph) | GM official |
| Cd | 0.29 | GM aerodynamics documentation; C5 wind-tunnel data |
| Frontal area | 1.88 m² | Estimated from C5 body cross-section |
| Tire size | 295/35R18 (rear, driving wheels) | GM press kit; front is 265/40R17 |

**Sources**: GM press release for 2003 Corvette Z06; Tremec T-56 transmission service manual; Car and Driver 2003 C5 Z06 long-term test (0–60: 3.9 s, ¼ mile: 12.0 s @ 113 mph); automobile-catalog.com/Chevrolet/Corvette/2003.
**Status**: New entry. Torque curve shape derived from published dyno data for LS6 with peak values matching GM spec. Rear tire used for simulation (driving wheels on RWD). Front tire (265/40R17) not represented — simulation uses single tire size.

---

## Known Remaining Approximations

The following fields are understood to be approximate but are within acceptable simulation tolerance and were not corrected in this audit pass:

- **Aero (Cd, frontal area)**: Frontal area is estimated from vehicle dimensions for most cars; Cd is from manufacturer-published values where available.
- **Torque curve shapes**: Curves are smoothed approximations; actual dyno shapes may show more variation, particularly near VTEC/turbo engagement points.
- **Ford Mustang GT 2024 power**: ~7% below published spec (334 vs 358 kW).
- **Subaru WRX STI 2021 torque**: ~3.5% above published spec (407 vs 393 Nm).
- **Scion FR-S 2013 curb weight**: ~3% below published spec (1213 vs 1247 kg).
