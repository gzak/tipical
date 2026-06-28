import { useState, useRef, useCallback, useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { useSearchStore } from '../../stores/searchStore';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useClearAutocomplete } from '../../hooks/useClearAutocomplete';
import { radiusFromZoom } from '../../utils/geo';
import { useDebounce } from '../../hooks/useDebounce';

interface SuggestionListProps {
  suggestions: google.maps.places.AutocompleteSuggestion[];
  activeIndex: number;
  onSelect: (suggestion: google.maps.places.AutocompleteSuggestion) => void;
  onHover: (index: number) => void;
}

function SuggestionList({ suggestions, activeIndex, onSelect, onHover }: SuggestionListProps) {
  if (!suggestions.length) return null;
  return (
    <ul
      role="listbox"
      className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg py-1 z-50 overflow-hidden"
    >
      {suggestions.map((suggestion, index) => {
        const prediction = suggestion.placePrediction;
        if (!prediction) return null;
        return (
          <li
            key={prediction.placeId}
            id={`suggestion-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            onMouseDown={() => onSelect(suggestion)}
            onMouseEnter={() => onHover(index)}
            className={`px-4 py-2.5 cursor-pointer text-sm ${
              index === activeIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
            }`}
          >
            <span className="font-medium text-gray-900">{prediction.mainText!.text}</span>
            {prediction.secondaryText?.text && (
              <span className="text-gray-500 ml-1.5">{prediction.secondaryText.text}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// AutocompleteSessionToken accepts a UUID string at runtime; TS types omit this constructor arg
function newAutocompleteSessionToken(uuid: string): google.maps.places.AutocompleteSessionToken {
  return new (google.maps.places.AutocompleteSessionToken as unknown as new (token: string) => google.maps.places.AutocompleteSessionToken)(uuid);
}

export function SearchBar() {
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const sessionTokenRef = useRef<string | null>(null);

  const inputValue = useSearchStore(s => s.inputValue);
  const setInputValue = useSearchStore(s => s.setInputValue);
  const setQuery = useSearchStore(s => s.setQuery);
  const setPlaceId = useSearchStore(s => s.setPlaceId);
  const setSearchCenter = useSearchStore(s => s.setSearchCenter);
  const placeId = useSearchStore(s => s.placeId);
  const clearAutocomplete = useClearAutocomplete();
  const map = useMap();

  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedInput = useDebounce(inputValue, 300);

  useClickOutside(containerRef, () => {
    setSuggestions([]);
    setActiveIndex(-1);
  });

  const startSession = useCallback(() => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = crypto.randomUUID();
    }
  }, []);

  const resetSession = useCallback(() => {
    sessionTokenRef.current = null;
  }, []);

  // When inputValue is cleared externally (e.g. info window ✕), clean up local autocomplete state.
  useEffect(() => {
    if (!inputValue) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([]);
      setActiveIndex(-1);
      resetSession();
    }
  }, [inputValue, resetSession]);

  useEffect(() => {
    const trimmed = debouncedInput.trim();
    if (!trimmed || !sessionTokenRef.current || !map) {
      setSuggestions([]);
      return;
    }

    const center = map.getCenter()!;
    const radius = radiusFromZoom(map.getZoom()!);

    let cancelled = false;

    google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: trimmed,
      sessionToken: newAutocompleteSessionToken(sessionTokenRef.current!),
      locationBias: {
        center: { lat: center.lat(), lng: center.lng() },
        radius,
      },
    }).then(({ suggestions: s }) => {
      if (!cancelled) { setSuggestions(s); setActiveIndex(-1); }
    }).catch(() => {
      if (!cancelled) setSuggestions([]);
    });

    return () => { cancelled = true; };
  }, [debouncedInput, map]);

  const selectSuggestion = useCallback((suggestion: google.maps.places.AutocompleteSuggestion) => {
    const prediction = suggestion.placePrediction;
    if (!prediction || !sessionTokenRef.current) return;

    const displayText = prediction.mainText!.text;
    setInputValue(displayText);
    setSuggestions([]);
    setActiveIndex(-1);
    setPlaceId(prediction.placeId, displayText, sessionTokenRef.current);
    resetSession();
  }, [setInputValue, setPlaceId, resetSession]);

  const handleClear = useCallback(() => {
    resetSession();
    clearAutocomplete();
  }, [resetSession, clearAutocomplete]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSuggestions([]);
    setActiveIndex(-1);
    resetSession();
    const center = map!.getCenter()!;
    setSearchCenter({ latitude: center.lat(), longitude: center.lng(), zoom: map!.getZoom()! });
    setQuery(inputValue);
  }, [inputValue, map, setSearchCenter, setQuery, resetSession]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.trim()) {
      startSession();
    } else {
      setSuggestions([]);
      setActiveIndex(-1);
      resetSession();
    }
  }, [setInputValue, startSession, resetSession]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!suggestions.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setActiveIndex(-1);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    }
  }, [suggestions, activeIndex, selectSuggestion]);

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 bg-white rounded-xl shadow-lg px-4 py-2"
      >
        <button type="submit" aria-label="Search" className="flex-shrink-0">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search businesses..."
          className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-400"
          autoComplete="off"
          role="combobox"
          aria-expanded={suggestions.length > 0}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
        />
        {(inputValue || placeId) && (
          <button type="button" onClick={handleClear} aria-label="Clear search" className="flex-shrink-0">
            <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </form>
      <SuggestionList
        suggestions={suggestions}
        activeIndex={activeIndex}
        onSelect={selectSuggestion}
        onHover={setActiveIndex}
      />
    </div>
  );
}
