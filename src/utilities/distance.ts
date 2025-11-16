/**
 * Haversine formula to calculate the distance between two coordinates in miles.
 */
export function calculateDistanceMiles(
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number,
): number {
  const R = 3959 // Earth's radius in miles
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(destLat - originLat)
  const dLon = toRad(destLon - originLon)
  const lat1 = toRad(originLat)
  const lat2 = toRad(destLat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Estimate travel time in minutes using a tiered average speed model.
 */
export function estimateEtaMinutes(distanceInMiles: number): number {
  let averageSpeed: number

  if (distanceInMiles < 5) {
    averageSpeed = 35
  } else if (distanceInMiles < 15) {
    averageSpeed = 45
  } else {
    averageSpeed = 55
  }

  return Math.round((distanceInMiles / averageSpeed) * 60)
}
