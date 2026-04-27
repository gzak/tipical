import { useMapStore } from '../../stores/mapStore';
import { useSearchStore } from '../../stores/searchStore';
import { useUIStore } from '../../stores/uiStore';
import { useSearchAreaChanged } from '../../hooks/useSearchAreaChanged';

export function SearchThisAreaButton() {
  const center = useMapStore(s => s.center);
  const zoom = useMapStore(s => s.zoom);
  const setSearchCenter = useSearchStore(s => s.setSearchCenter);
  const setShowSearchThisArea = useUIStore(s => s.setShowSearchThisArea);
  const visible = useSearchAreaChanged();

  if (!visible || !center) return null;

  return (
    <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none z-10">
      <button
        onClick={() => {
          setSearchCenter({ latitude: center.lat, longitude: center.lng, zoom });
          setShowSearchThisArea(false);
        }}
        className="pointer-events-auto bg-white text-gray-800 text-sm font-medium px-4 py-2 rounded-full shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
      >
        Search this area
      </button>
    </div>
  );
}
