import { useParams, Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { AgentCard } from '../components';
import { useCategoriesStore, useSearchStore } from '../stores';
import { agents } from '../data/mockData';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { getCategory, categories } = useCategoriesStore();
  const { sort, setSort, filters, setFilters } = useSearchStore();

  const category = getCategory(slug || '');
  const categoryAgents = agents.filter(a => a.category.slug === slug);

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Category not found</h1>
          <Link to="/categories" className="text-primary-500 mt-4 inline-block">
            Browse all categories
          </Link>
        </div>
      </div>
    );
  }

  const sortOptions = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'bestselling', label: 'Best Selling' },
    { value: 'newest', label: 'Newest' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
  ];

  const deliveryOptions = [
    { value: null, label: 'Any' },
    { value: 1, label: 'Up to 24 hours' },
    { value: 3, label: 'Up to 3 days' },
    { value: 7, label: 'Up to 7 days' },
  ];

  const priceRanges = [
    { value: [0, 10000], label: 'Any' },
    { value: [0, 50], label: 'Under $50' },
    { value: [50, 100], label: '$50 - $100' },
    { value: [100, 200], label: '$100 - $200' },
    { value: [200, 10000], label: '$200+' },
  ];

  // Apply sorting
  let sortedAgents = [...categoryAgents];
  switch (sort) {
    case 'bestselling':
      sortedAgents.sort((a, b) => b.orderCount - a.orderCount);
      break;
    case 'newest':
      sortedAgents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'price_low':
      sortedAgents.sort((a, b) => a.pricing.startingPrice - b.pricing.startingPrice);
      break;
    case 'price_high':
      sortedAgents.sort((a, b) => b.pricing.startingPrice - a.pricing.startingPrice);
      break;
    default:
      sortedAgents.sort((a, b) => (b.rating * b.orderCount) - (a.rating * a.orderCount));
  }

  // Apply filters
  if (filters.deliveryTime) {
    sortedAgents = sortedAgents.filter(a => a.deliveryTime <= filters.deliveryTime!);
  }
  if (filters.priceRange) {
    sortedAgents = sortedAgents.filter(a => 
      a.pricing.startingPrice >= filters.priceRange[0] &&
      a.pricing.startingPrice <= filters.priceRange[1]
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-primary-500">Home</Link>
            <ChevronRightIcon className="h-4 w-4 mx-2" />
            <Link to="/categories" className="hover:text-primary-500">Categories</Link>
            <ChevronRightIcon className="h-4 w-4 mx-2" />
            <span className="text-gray-900">{category.name}</span>
          </nav>

          <div className="flex items-center">
            <span className="text-4xl mr-4">{category.icon}</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
              <p className="text-gray-500 mt-1">{category.description}</p>
            </div>
          </div>

          {/* Subcategories */}
          <div className="flex flex-wrap gap-2 mt-6">
            <button className="px-4 py-2 bg-primary-500 text-white text-sm rounded-full">
              All
            </button>
            {category.subcategories.map((sub) => (
              <button
                key={sub.id}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition"
              >
                {sub.name} ({sub.agentCount})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>

              {/* Delivery Time */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Delivery Time</h4>
                <div className="space-y-2">
                  {deliveryOptions.map((option) => (
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
                <div className="space-y-2">
                  {priceRanges.map((option) => (
                    <label key={option.label} className="flex items-center">
                      <input
                        type="radio"
                        name="price"
                        checked={
                          filters.priceRange[0] === option.value[0] && 
                          filters.priceRange[1] === option.value[1]
                        }
                        onChange={() => setFilters({ priceRange: option.value as [number, number] })}
                        className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-600">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Seller Level */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Seller Level</h4>
                <div className="space-y-2">
                  {[
                    { value: 'topRated', label: 'Top Rated Seller' },
                    { value: 'level2', label: 'Level 2 Seller' },
                    { value: 'level1', label: 'Level 1 Seller' },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-600">{option.label}</span>
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
                <span className="font-medium text-gray-900">{sortedAgents.length}</span> results
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

            {/* Results Grid */}
            {sortedAgents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-500">No agents found in this category</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
