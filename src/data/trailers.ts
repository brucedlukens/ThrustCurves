import type { TrailerLoad, TrailerPreset } from '@/types/truck'

/**
 * Rolling resistance coefficient for ST (Special Trailer) tires.
 * Derived from passenger-tire baselines (NAS SR 286) plus the radial/bias
 * differential; ST tires prioritize load capacity over rolling resistance.
 */
export const TRAILER_TIRE_CRR = 0.013

/**
 * Trailer presets. Masses/dimensions come from manufacturer specs for common
 * models in each class; cd is the standalone body drag coefficient and
 * exposureFactor is the interference factor k in
 *   CdA_combined = CdA_truck + k · cd · frontalArea
 * calibrated so combined-drag increases match published wind-tunnel/CFD/fuel
 * data (see src/data/TRUCK_SOURCES.md).
 */
export const TRAILER_PRESETS: TrailerPreset[] = [
  {
    id: 'utility-flatbed-empty',
    name: 'Utility / flatbed (empty)',
    category: 'flatbed',
    defaultMassKg: 900,
    massRangeKg: [700, 1200],
    frontalAreaM2: 0.9,
    cd: 0.9,
    exposureFactor: 0.25,
    crr: TRAILER_TIRE_CRR,
    description: '16-ft tandem-axle open utility/car hauler, unloaded',
  },
  {
    id: 'flatbed-car-loaded',
    name: 'Flatbed with car',
    category: 'flatbed',
    defaultMassKg: 2500,
    massRangeKg: [1850, 3400],
    frontalAreaM2: 2.4,
    cd: 0.65,
    exposureFactor: 0.55,
    crr: TRAILER_TIRE_CRR,
    description: '16-ft open trailer carrying a ~3,500 lb car',
  },
  {
    id: 'enclosed-cargo-standard',
    name: 'Enclosed cargo (standard height)',
    category: 'enclosed',
    defaultMassKg: 2600,
    massRangeKg: [1450, 4500],
    frontalAreaM2: 6.0,
    cd: 0.75,
    exposureFactor: 0.6,
    crr: TRAILER_TIRE_CRR,
    description: "8.5×20 enclosed car hauler, ~6'6\" interior, loaded",
  },
  {
    id: 'enclosed-cargo-tall',
    name: 'Enclosed cargo (extra tall)',
    category: 'enclosed',
    defaultMassKg: 2700,
    massRangeKg: [1500, 4500],
    frontalAreaM2: 6.7,
    cd: 0.8,
    exposureFactor: 0.7,
    crr: TRAILER_TIRE_CRR,
    description: "8.5-ft wide enclosed with 7.5–8 ft interior height, loaded",
  },
  {
    id: 'travel-trailer-mid',
    name: 'Travel trailer (26–28 ft)',
    category: 'travel',
    defaultMassKg: 3200,
    massRangeKg: [2900, 3650],
    frontalAreaM2: 7.4,
    cd: 0.6,
    exposureFactor: 0.65,
    crr: TRAILER_TIRE_CRR,
    description: 'Mid-size bumper-pull camper, ~10.5–11 ft tall, loaded',
  },
  {
    id: 'travel-trailer-large',
    name: 'Travel trailer (32–35 ft)',
    category: 'travel',
    defaultMassKg: 4300,
    massRangeKg: [3600, 4800],
    frontalAreaM2: 8.0,
    cd: 0.62,
    exposureFactor: 0.75,
    crr: TRAILER_TIRE_CRR,
    description: 'Large bumper-pull travel trailer / toy hauler, loaded',
  },
  {
    id: 'fifth-wheel-mid',
    name: 'Fifth wheel (~32 ft)',
    category: 'fifthwheel',
    defaultMassKg: 5200,
    massRangeKg: [4500, 5900],
    frontalAreaM2: 9.0,
    cd: 0.7,
    exposureFactor: 0.55,
    crr: TRAILER_TIRE_CRR,
    description: '~13 ft tall; over-bed nose improves truck integration',
  },
  {
    id: 'fifth-wheel-large',
    name: 'Fifth wheel (38–40 ft)',
    category: 'fifthwheel',
    defaultMassKg: 7000,
    massRangeKg: [6300, 7900],
    frontalAreaM2: 9.6,
    cd: 0.72,
    exposureFactor: 0.62,
    crr: TRAILER_TIRE_CRR,
    description: 'Large fifth wheel / toy hauler, ~13.5 ft tall, loaded',
  },
  {
    id: 'boat-trailer',
    name: 'Boat on trailer (~24 ft)',
    category: 'boat',
    defaultMassKg: 2700,
    massRangeKg: [2400, 3600],
    frontalAreaM2: 2.0,
    cd: 0.45,
    exposureFactor: 0.3,
    crr: TRAILER_TIRE_CRR,
    description: 'Bowrider/center-console on tandem bunk trailer',
  },
  {
    id: 'gooseneck-equipment',
    name: 'Gooseneck with equipment',
    category: 'gooseneck',
    defaultMassKg: 5400,
    massRangeKg: [4500, 6800],
    frontalAreaM2: 3.6,
    cd: 0.85,
    exposureFactor: 0.45,
    crr: TRAILER_TIRE_CRR,
    description: '20-ft gooseneck deckover with a skid steer',
  },
]

/** Resolve a preset (with a user-adjusted mass) into engine-ready trailer parameters */
export function trailerToLoad(preset: TrailerPreset, massKg: number): TrailerLoad {
  return {
    massKg,
    effectiveCdA: preset.cd * preset.frontalAreaM2 * preset.exposureFactor,
    crr: preset.crr,
  }
}
