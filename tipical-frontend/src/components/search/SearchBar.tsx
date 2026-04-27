import { useState } from 'react';
import { useSearchStore } from '../../stores/searchStore';

export function SearchBar() {
  const [inputValue, setInputValue] = useState('');
  const setQuery = useSearchStore(s => s.setQuery);

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
    </form>
  );
}
