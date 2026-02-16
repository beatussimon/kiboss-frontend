/**
 * Calculate distance between two coordinates using the Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get the distance from user location to the nearest stop of a ride
 */
export function getDistanceToRide(
  userLat: number,
  userLon: number,
  stops: Array<{ latitude: number; longitude: number }>
): number {
  if (!stops || stops.length === 0) return Infinity;
  
  let minDistance = Infinity;
  
  for (const stop of stops) {
    if (stop.latitude && stop.longitude) {
      const distance = calculateDistance(
        userLat,
        userLon,
        stop.latitude,
        stop.longitude
      );
      if (distance < minDistance) {
        minDistance = distance;
      }
    }
  }
  
  return minDistance;
}
