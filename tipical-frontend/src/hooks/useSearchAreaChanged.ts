import { useEffect } from 'react';
import { useMapStore } from '../stores/mapStore';
import { useSearchStore } from '../stores/searchStore';
import { useUIStore } from '../stores/uiStore';
import { haversineDistance, radiusFromZoom } from '../utils/geo';

export function useSearchAreaChanged(): boolean {
  const center = useMapStore(s => s.center);
  const zoom = useMapStore(s => s.zoom);
  const searchCenter = useSearchStore(s => s.searchCenter);
  const showSearchThisArea = useUIStore(s => s.showSearchThisArea);
  const setShowSearchThisArea = useUIStore(s => s.setShowSearchThisArea);

  useEffect(() => {
    if (!center || !searchCenter) return;

    const zoomChanged = zoom !== searchCenter.zoom;
    const radius = radiusFromZoom(zoom);
    const distance = haversineDistance(center.lat, center.lng, searchCenter.latitude, searchCenter.longitude);
    const pannedFarEnough = distance > radius * 0.3;

    if (zoomChanged || pannedFarEnough) {
      setShowSearchThisArea(true);
    }
  }, [center, zoom, searchCenter, setShowSearchThisArea]);

  return showSearchThisArea;
}
