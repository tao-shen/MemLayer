import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  HeartIcon, 
  ShoppingCartIcon,
  Bars3Icon,
  XMarkIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useUIStore, useUserStore, useCartStore, useCategoriesStore } from '../stores';
import clsx from 'clsx';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  const { isMobileMenuOpen, toggleMobileMenu, openLoginModal } = useUIStore();
  const { isAuthenticated, user } = useUserStore();
  const { items } = useCartStore();
  const { categories } = useCategoriesStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      {/* Top Bar */}
      <div className="bg-dark-800 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-sm">
          <div className="hidden md:flex items-center space-x-4">
            <span>Discover the best AI Agents</span>
          </div>
          <div className="flex items-center space-x-4 ml-auto">
            <button className="flex items-center hover:text-primary-400 transition">
              <GlobeAltIcon className="h-4 w-4 mr-1" />
              English
            </button>
            <span className="text-gray-500">|</span>
            <Link to="/become-seller" className="hover:text-primary-400 transition">
              Become a Seller
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-dark-900">
                Agent<span className="text-primary-500">Store</span>
              </span>
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <div className="flex">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search AI Agents..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary-500 text-white rounded-r-md hover:bg-primary-600 transition"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              {/* Favorites */}
              <Link
                to="/favorites"
                className="hidden md:flex items-center text-gray-600 hover:text-primary-500 transition"
              >
                <HeartIcon className="h-6 w-6" />
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative flex items-center text-gray-600 hover:text-primary-500 transition"
              >
                <ShoppingCartIcon className="h-6 w-6" />
                {items.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="flex items-center text-gray-600 hover:text-primary-500 transition"
                >
                  <img
                    src={user?.avatar}
                    alt={user?.displayName}
                    className="h-8 w-8 rounded-full"
                  />
                </Link>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <button
                    onClick={openLoginModal}
                    className="text-gray-600 hover:text-primary-500 transition font-medium"
                  >
                    Sign In
                  </button>
                  <Link
                    to="/signup"
                    className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition font-medium"
                  >
                    Join
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 text-gray-600 hover:text-primary-500 transition"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Categories Navigation - Only show when categories exist */}
        {categories.length > 0 && (
          <nav className="hidden md:block border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ul className="flex items-center space-x-8 overflow-x-auto py-3 text-sm">
                {categories.slice(0, 8).map((category) => (
                  <li key={category.id}>
                    <Link
                      to={`/categories/${category.slug}`}
                      className="text-gray-600 hover:text-primary-500 transition whitespace-nowrap"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        )}
      </div>

      {/* Mobile Menu */}
      <div
        className={clsx(
          'md:hidden fixed inset-0 z-40 transition-transform duration-300',
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="absolute inset-0 bg-black/50" onClick={toggleMobileMenu} />
        <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl">
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xl font-bold">Menu</span>
              <button onClick={toggleMobileMenu}>
                <XMarkIcon className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search AI Agents..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
              </div>
            </form>

            {/* Mobile Categories - Only show when categories exist */}
            {categories.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Categories
                </h3>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/categories/${category.slug}`}
                    onClick={toggleMobileMenu}
                    className="flex items-center py-2 text-gray-700 hover:text-primary-500 transition"
                  >
                    <span className="mr-3">{category.icon}</span>
                    {category.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Mobile Auth */}
            {!isAuthenticated && (
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <button
                  onClick={() => {
                    toggleMobileMenu();
                    openLoginModal();
                  }}
                  className="w-full py-2 text-center border border-primary-500 text-primary-500 rounded-md hover:bg-primary-50 transition"
                >
                  Sign In
                </button>
                <Link
                  to="/signup"
                  onClick={toggleMobileMenu}
                  className="block w-full py-2 text-center bg-primary-500 text-white rounded-md hover:bg-primary-600 transition"
                >
                  Join
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
