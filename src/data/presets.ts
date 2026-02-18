/** Altitude preset for air density calculations */
export interface AltitudePreset {
  name: string
  altitudeM: number
}

export const ALTITUDE_PRESETS: AltitudePreset[] = [
  { name: 'Sea Level', altitudeM: 0 },
  { name: 'Denver, CO', altitudeM: 1609 },
  { name: 'Mexico City', altitudeM: 2240 },
  { name: 'Bogotá', altitudeM: 2625 },
  { name: 'La Paz', altitudeM: 3625 },
]

/** Default rolling resistance coefficient (asphalt, good tires) */
export const DEFAULT_CRR = 0.015

/** Gravitational acceleration (m/s²) */
export const GRAVITY_MS2 = 9.81

/** Sea-level air density (kg/m³) */
export const SEA_LEVEL_AIR_DENSITY = 1.225
