import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface SearchBarProps {
  variant?: 'default' | 'hero';
  placeholder?: string;
  className?: string;
  defaultValue?: string;
}

const trendingSearches = [
  'Content Writing',
  'Code Assistant', 
  'Data Analysis',
  'AI Art Generator',
  'Translation',
  'Chatbot',
  'SEO Optimization',
  'Video Editing',
];

export default function SearchBar({ 
  variant = 'default', 
  placeholder = 'Search AI Agents...', 
  className,
  defaultValue = ''
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handlePopularClick = (term: string) => {
    setQuery(term);
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  if (variant === 'hero') {
    return (
      <div className={clsx('w-full max-w-3xl mx-auto', className)}>
        <form onSubmit={handleSearch}>
          <div 
            className={clsx(
              'relative bg-white rounded-lg shadow-xl transition-all duration-300',
              isFocused && 'ring-2 ring-primary-500'
            )}
          >
            <div className="flex items-center">
              <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 ml-5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                className="flex-1 px-4 py-5 text-lg bg-transparent border-none focus:outline-none"
              />
              <button
                type="submit"
                className="m-2 px-8 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {/* Trending Searches */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-white/80 text-sm">Trending:</span>
          {trendingSearches.map((term) => (
            <button
              key={term}
              onClick={() => handlePopularClick(term)}
              className="px-3 py-1 text-sm text-white/90 border border-white/30 rounded-full hover:bg-white/10 transition"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSearch} className={clsx('relative', className)}>
      <div 
        className={clsx(
          'flex items-center border border-gray-300 rounded-lg transition-all',
          isFocused && 'ring-2 ring-primary-500 border-primary-500'
        )}
      >
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 ml-3" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 bg-transparent border-none focus:outline-none text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-r-lg hover:bg-primary-600 transition"
        >
          Search
        </button>
      </div>
    </form>
  );
}
