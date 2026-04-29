import { useSearchStore } from '../stores/searchStore';
import { haversineDistance, radiusFromZoom } from '../utils/geo';

export function useSearchAreaChanged(center: { lat: number; lng: number }, zoom: number): boolean {
  const searchCenter = useSearchStore(s => s.searchCenter);

  const zoomChanged = zoom !== searchCenter.zoom;
  const radius = radiusFromZoom(zoom);
  const distance = haversineDistance(center.lat, center.lng, searchCenter.latitude, searchCenter.longitude);
  const pannedFarEnough = distance > radius * 0.3;

  return zoomChanged || pannedFarEnough;
}
