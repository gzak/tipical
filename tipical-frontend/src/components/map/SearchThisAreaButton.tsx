import { useSearchStore } from '../../stores/searchStore';
import { useSearchAreaChanged } from '../../hooks/useSearchAreaChanged';

interface SearchThisAreaButtonProps {
  center: { lat: number; lng: number };
  zoom: number;
  isSearching?: boolean;
}

export function SearchThisAreaButton({ center, zoom, isSearching = false }: SearchThisAreaButtonProps) {
  const setSearchCenter = useSearchStore(s => s.setSearchCenter);
  const placeId = useSearchStore(s => s.placeId);
  const visible = useSearchAreaChanged(center, zoom);

  if (placeId) return null;
  if (!visible && !isSearching) return null;

  return (
    <button
      onClick={() => setSearchCenter({ latitude: center.lat, longitude: center.lng, zoom })}
      disabled={isSearching}
      className="m-3 inline-flex items-center gap-2 bg-white text-gray-800 text-sm font-medium px-4 py-2 rounded-full shadow-md hover:bg-gray-50 disabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-80 transition-colors border border-gray-200"
    >
      {isSearching && (
        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" aria-hidden="true" />
      )}
      Search this area
    </button>
  );
}
