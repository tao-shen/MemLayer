import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { AgentCard, SearchBar } from '../components';
import { useSearchStore, useCategoriesStore } from '../stores';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const { 
    results, 
    isLoading, 
    setQuery, 
    sort, 
    setSort, 
    filters, 
    setFilters,
    clearFilters 
  } = useSearchStore();
  const { categories } = useCategoriesStore();

  useEffect(() => {
    setQuery(query);
  }, [query, setQuery]);

  const sortOptions = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'bestselling', label: 'Best Selling' },
    { value: 'newest', label: 'Newest' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
  ];

  const hasActiveFilters = 
    filters.deliveryTime !== null || 
    filters.priceRange[0] !== 0 || 
    filters.priceRange[1] !== 10000 ||
    filters.sellerLevel.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-2xl">
            <SearchBar defaultValue={query} />
          </div>
          
          {query && (
            <p className="mt-4 text-gray-600">
              Results for "<span className="font-medium text-gray-900">{query}</span>"
            </p>
          )}

          {/* Category Pills - Only show when categories exist */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  to={`/categories/${category.slug}`}
                  className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                >
                  {category.icon} {category.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <FunnelIcon className="h-5 w-5 mr-2" />
                  Filters
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary-500 hover:text-primary-600"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Delivery Time */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Delivery Time</h4>
                <div className="space-y-2">
                  {[
                    { value: null, label: 'Any' },
                    { value: 1, label: 'Up to 24 hours' },
                    { value: 3, label: 'Up to 3 days' },
                    { value: 7, label: 'Up to 7 days' },
                  ].map((option) => (
                    <label key={option.label} className="flex items-center">
                      <input
                        type="radio"
                        name="delivery"
                        checked={filters.deliveryTime === option.value}
                        onChange={() => setFilters({ deliveryTime: option.value })}
                        className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-600">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Budget</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceRange[0] || ''}
                    onChange={(e) => setFilters({ 
                      priceRange: [Number(e.target.value) || 0, filters.priceRange[1]] 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceRange[1] === 10000 ? '' : filters.priceRange[1]}
                    onChange={(e) => setFilters({ 
                      priceRange: [filters.priceRange[0], Number(e.target.value) || 10000] 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Seller Rating</h4>
                <div className="space-y-2">
                  {[4.5, 4.0, 3.5, null].map((rating) => (
                    <label key={rating || 'all'} className="flex items-center">
                      <input
                        type="radio"
                        name="rating"
                        checked={filters.rating === rating}
                        onChange={() => setFilters({ rating })}
                        className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        {rating ? `${rating}+ stars` : 'Any'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Sort Bar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-900">{results.length}</span> results
              </p>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Sort by:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.deliveryTime && (
                  <span className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full">
                    Up to {filters.deliveryTime} days
                    <button
                      onClick={() => setFilters({ deliveryTime: null })}
                      className="ml-1.5"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </span>
                )}
                {filters.rating && (
                  <span className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full">
                    {filters.rating}+ stars
                    <button
                      onClick={() => setFilters({ rating: null })}
                      className="ml-1.5"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Results */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
                    <div className="aspect-[4/3] bg-gray-200" />
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-500 mb-6">
                  Try different keywords or clear your filters
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
