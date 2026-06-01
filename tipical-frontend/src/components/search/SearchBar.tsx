import { useState, useRef, useCallback, useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { useSearchStore } from '../../stores/searchStore';
import { useDebounce, useClickOutside } from '../../hooks';
import { PLACE_SELECT_ZOOM, radiusFromZoom } from '../../utils/geo';

export function SearchBar() {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  const map = useMap();
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const setQuery = useSearchStore(s => s.setQuery);
  const selectPlace = useSearchStore(s => s.selectPlace);
  const searchCenter = useSearchStore(s => s.searchCenter);

  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, () => setIsOpen(false));

  const debouncedInput = useDebounce(inputValue, 300);

  const getSessionToken = useCallback(() => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
    return sessionTokenRef.current;
  }, []);

  useEffect(() => {
    if (!debouncedInput.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const radius = radiusFromZoom(searchCenter.zoom);
    google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: debouncedInput,
      sessionToken: getSessionToken(),
      locationBias: {
        center: { lat: searchCenter.latitude, lng: searchCenter.longitude },
        radius,
      },
    })
      .then(({ suggestions: results }) => {
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setActiveIndex(-1);
      })
      .catch(() => {
        setSuggestions([]);
        setIsOpen(false);
      });
  }, [debouncedInput, getSessionToken, searchCenter]);

  const closeSuggestions = useCallback(() => {
    setIsOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
    sessionTokenRef.current = null;
  }, []);

  const handleSelectSuggestion = useCallback(async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    const pred = suggestion.placePrediction;
    if (!pred) return;

    const displayText = pred.mainText?.text ?? pred.text.text;
    setInputValue(displayText);
    closeSuggestions();

    try {
      const place = pred.toPlace();
      await place.fetchFields({ fields: ['location', 'displayName'] });

      if (place.location) {
        const lat = place.location.lat();
        const lng = place.location.lng();
        const center = { latitude: lat, longitude: lng, zoom: PLACE_SELECT_ZOOM };

        if (map) {
          map.panTo({ lat, lng });
          map.setZoom(PLACE_SELECT_ZOOM);
        }

        selectPlace(place.displayName ?? displayText, center);
      }
    } catch {
      setQuery(displayText);
    }
  }, [map, selectPlace, setQuery, closeSuggestions]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    closeSuggestions();
    setQuery(inputValue);
  }, [inputValue, setQuery, closeSuggestions]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, -1));
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      case 'Enter':
        if (activeIndex >= 0) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[activeIndex]);
        }
        break;
    }
  }, [isOpen, suggestions, activeIndex, handleSelectSuggestion]);

  return (
    <div ref={containerRef} className="relative">
      <form
        onSubmit={handleSubmit}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
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
          onKeyDown={handleKeyDown}
          placeholder="Search businesses..."
          className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-400"
          aria-autocomplete="list"
          aria-controls={isOpen ? 'search-suggestions' : undefined}
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
        />
      </form>

      {isOpen && suggestions.length > 0 && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg overflow-hidden z-50"
        >
          {suggestions.map((suggestion, index) => {
            const pred = suggestion.placePrediction;
            const main = pred?.mainText?.text;
            const secondary = pred?.secondaryText?.text;
            return (
              <li
                key={pred?.placeId ?? index}
                id={`suggestion-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={e => { e.preventDefault(); handleSelectSuggestion(suggestion); }}
                className={`flex flex-col px-4 py-2.5 cursor-pointer text-sm ${index === activeIndex ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <span className="font-medium text-gray-900 truncate">{main ?? pred?.text.text}</span>
                {secondary && <span className="text-gray-500 text-xs truncate">{secondary}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
