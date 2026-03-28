import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSearchStore } from '../../stores/searchStore';
import { useGeolocation } from '../../hooks/useGeolocation';

export function SearchBar() {
  const [inputValue, setInputValue] = useState('');

  const { setQuery, setLocation } = useSearchStore(
    useShallow(s => ({ setQuery: s.setQuery, setLocation: s.setLocation }))
  );

  const { requestLocation, isLoading: isLocating, latitude, longitude, error: geoError } = useGeolocation();

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      setLocation({ latitude, longitude });
    }
  }, [latitude, longitude, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(inputValue);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 bg-white rounded-xl shadow-lg px-4 py-2 w-full max-w-xl"
    >
      <button type="submit" aria-label="Search" className="flex-shrink-0">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
      <input
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        placeholder="Search businesses..."
        className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-400"
      />
      {geoError && (
        <p className="text-xs text-red-500 flex-shrink-0">Location unavailable</p>
      )}
      <button
        type="button"
        onClick={requestLocation}
        disabled={isLocating}
        className="flex-shrink-0 flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {isLocating ? 'Locating…' : 'Near me'}
      </button>
    </form>
  );
}
