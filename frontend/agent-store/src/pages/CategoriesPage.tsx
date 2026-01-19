import { Link } from 'react-router-dom';
import { CategoryCard } from '../components';
import { categories } from '../data/mockData';

export default function CategoriesPage() {
  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-dark-900 to-dark-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-4">Explore Categories</h1>
            <p className="text-xl text-gray-300 max-w-2xl">
              Browse our curated AI Agent categories to find the perfect solution for your needs
            </p>
          </div>
        </div>

        {/* Empty State */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="text-6xl mb-6">📂</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Categories Coming Soon</h2>
          <p className="text-gray-500 mb-8">
            We're working on organizing our AI Agents into helpful categories. Check back soon!
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-dark-900 to-dark-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Explore Categories</h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            Browse our curated AI Agent categories to find the perfect solution for your needs
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>

      {/* Popular Categories */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Popular Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.slice(0, 4).map((category) => (
              <CategoryCard key={category.id} category={category} variant="large" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
