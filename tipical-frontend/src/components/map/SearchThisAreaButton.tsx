import { useSearchStore } from '../../stores/searchStore';
import { useSearchAreaChanged } from '../../hooks/useSearchAreaChanged';

interface SearchThisAreaButtonProps {
  center: { lat: number; lng: number };
  zoom: number;
}

export function SearchThisAreaButton({ center, zoom }: SearchThisAreaButtonProps) {
  const setSearchCenter = useSearchStore(s => s.setSearchCenter);
  const visible = useSearchAreaChanged(center, zoom);

  if (!visible) return null;

  return (
    <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none z-10">
      <button
        onClick={() => setSearchCenter({ latitude: center.lat, longitude: center.lng, zoom })}
        className="pointer-events-auto bg-white text-gray-800 text-sm font-medium px-4 py-2 rounded-full shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
      >
        Search this area
      </button>
    </div>
  );
}
