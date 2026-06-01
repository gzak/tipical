export const PLACE_SELECT_ZOOM = 17;

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Zoom 13 → 5 000 m; each step halves/doubles. Capped at Google Places' 50 000 m max.
export function radiusFromZoom(zoom: number): number {
  return Math.min(50_000, Math.round(5_000 * Math.pow(2, 13 - zoom)));
}
