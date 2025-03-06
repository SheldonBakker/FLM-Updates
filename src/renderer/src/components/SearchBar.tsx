/* eslint-disable prettier/prettier */
import { useState, useEffect } from 'react';
import { DashboardIcons } from './icons/DashboardIcons';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

function SearchBar({ onSearch, isLoading = false }: SearchBarProps): React.JSX.Element {
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearch(query);
    }, 300);

    return (): void => clearTimeout(delayDebounceFn);
  }, [query, onSearch]);


  return (
    <div className="relative flex-1 max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, ID, or email..."
          className="w-full px-4 py-2 bg-stone-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isLoading ? (
            <DashboardIcons.Refresh className="w-5 h-5 text-orange-500 animate-spin" />
          ) : (
            <DashboardIcons.Search className="w-5 h-5 text-stone-400" />
          )}
        </div>
      </div>
      {query && (
        <div className="absolute mt-1 text-sm text-stone-400">
          Tip: Use @ for email, numbers for ID, or names
        </div>
      )}
    </div>
  );
}

export default SearchBar; 