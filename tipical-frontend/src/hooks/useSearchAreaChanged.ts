import { useSearchStore } from '../stores/searchStore';
import { haversineDistance, radiusFromZoom } from '../utils/geo';

export function useSearchAreaChanged(center: { lat: number; lng: number }, zoom: number): boolean {
  const buttonBaseCenter = useSearchStore(s => s.buttonBaseCenter);

  const zoomChanged = zoom !== buttonBaseCenter.zoom;
  const radius = radiusFromZoom(zoom);
  const distance = haversineDistance(center.lat, center.lng, buttonBaseCenter.latitude, buttonBaseCenter.longitude);
  const pannedFarEnough = distance > radius * 0.3;

  return zoomChanged || pannedFarEnough;
}
