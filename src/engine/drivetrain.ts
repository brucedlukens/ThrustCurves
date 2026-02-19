/**
 * Wheel torque in Nm.
 * T_wheel = T_engine * gearRatio * finalDriveRatio * (1 - drivetrainLoss)
 */
export function wheelTorqueNm(
  engineTorqueNm: number,
  gearRatio: number,
  finalDriveRatio: number,
  drivetrainLoss: number,
): number {
  return engineTorqueNm * gearRatio * finalDriveRatio * (1 - drivetrainLoss)
}

/**
 * Convert engine RPM to vehicle speed in m/s.
 * speed = (RPM / (gearRatio * finalDrive)) * (2π / 60) * tireRadius
 */
export function rpmToSpeedMs(
  rpm: number,
  gearRatio: number,
  finalDriveRatio: number,
  tireRadiusM: number,
): number {
  return (rpm / (gearRatio * finalDriveRatio)) * ((2 * Math.PI) / 60) * tireRadiusM
}

/**
 * Convert vehicle speed in m/s to engine RPM.
 * RPM = speed * gearRatio * finalDrive * 60 / (2π * tireRadius)
 */
export function speedMsToRpm(
  speedMs: number,
  gearRatio: number,
  finalDriveRatio: number,
  tireRadiusM: number,
): number {
  return (speedMs * gearRatio * finalDriveRatio * 60) / (2 * Math.PI * tireRadiusM)
}
