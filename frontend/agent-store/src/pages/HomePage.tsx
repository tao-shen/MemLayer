import { Link } from 'react-router-dom';
import { ArrowRightIcon, SparklesIcon, ShieldCheckIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { SearchBar, AgentCard, CategoryCard } from '../components';
import { categories, getFeaturedAgents, getPopularAgents } from '../data/mockData';

const features = [
  {
    icon: SparklesIcon,
    title: 'Curated Quality Agents',
    description: 'Every agent is thoroughly reviewed to ensure quality and reliability',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Secure Transactions',
    description: 'Full payment protection with money-back guarantee',
  },
  {
    icon: ClockIcon,
    title: 'Fast Response',
    description: 'Average 2-hour response time, most orders delivered within 24 hours',
  },
  {
    icon: CurrencyDollarIcon,
    title: 'Transparent Pricing',
    description: 'Clear pricing structure with no hidden fees',
  },
];

export default function HomePage() {
  const featuredAgents = getFeaturedAgents();
  const popularAgents = getPopularAgents().slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25px 25px, white 2%, transparent 0%)',
            backgroundSize: '50px 50px',
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Find the Perfect
              <span className="text-primary-400"> AI Agent</span>
              <br />
              for Your Business
            </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Discover thousands of professional AI agents for any task. From content creation to code development, find the perfect solution for your needs.
            </p>

            <SearchBar variant="hero" placeholder="Search for AI Agents..." />
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Categories Section - Hidden when empty */}
      {categories.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Explore Categories</h2>
                <p className="text-gray-500 mt-2">Find AI Agents that match your needs</p>
              </div>
              <Link
                to="/categories"
                className="hidden md:flex items-center text-primary-500 hover:text-primary-600 font-medium"
              >
                View All
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {categories.slice(0, 8).map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>

            <Link
              to="/categories"
              className="md:hidden flex items-center justify-center text-primary-500 mt-6 font-medium"
            >
              View All Categories
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </section>
      )}

      {/* Featured Agents - Hidden when empty */}
      {featuredAgents.length > 0 && (
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Featured Agents</h2>
                <p className="text-gray-500 mt-2">Editor's picks of top-quality agents</p>
              </div>
              <Link
                to="/search?featured=true"
                className="hidden md:flex items-center text-primary-500 hover:text-primary-600 font-medium"
              >
                View More
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Agents - Hidden when empty */}
      {popularAgents.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Popular Agents</h2>
                <p className="text-gray-500 mt-2">Most loved by our users</p>
              </div>
              <Link
                to="/search?sort=bestselling"
                className="hidden md:flex items-center text-primary-500 hover:text-primary-600 font-medium"
              >
                View More
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Section - Case Cards */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Trending</h2>
              <p className="text-gray-500 mt-2">Most popular services this week</p>
            </div>
            <Link
              to="/search?sort=trending"
              className="hidden md:flex items-center text-primary-500 hover:text-primary-600 font-medium"
            >
              View All
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              { 
                title: 'AI Logo Design',
                image: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=400&h=300&fit=crop',
                category: 'AI Art'
              },
              { 
                title: 'Blog Writing',
                image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop',
                category: 'Content'
              },
              { 
                title: 'Code Review',
                image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop',
                category: 'Development'
              },
              { 
                title: 'Data Visualization',
                image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
                category: 'Analytics'
              },
              { 
                title: 'Social Media Bot',
                image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop',
                category: 'Automation'
              },
              { 
                title: 'AI Illustrations',
                image: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=400&h=300&fit=crop',
                category: 'AI Art'
              },
              { 
                title: 'SEO Content',
                image: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400&h=300&fit=crop',
                category: 'Marketing'
              },
              { 
                title: 'API Integration',
                image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop',
                category: 'Development'
              },
              { 
                title: 'Voice Assistant',
                image: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=400&h=300&fit=crop',
                category: 'AI Voice'
              },
              { 
                title: 'Email Automation',
                image: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400&h=300&fit=crop',
                category: 'Automation'
              },
            ].map((item, index) => (
              <Link
                key={index}
                to={`/search?q=${encodeURIComponent(item.title)}`}
                className="group relative block rounded-xl overflow-hidden aspect-[4/3] bg-gray-100"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="text-xs text-white/80 mb-1 block">{item.category}</span>
                  <h3 className="text-white font-semibold text-sm group-hover:text-primary-300 transition">
                    {item.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Empty State - Show when no data */}
      {categories.length === 0 && featuredAgents.length === 0 && (
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="text-6xl mb-6">🚀</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h2>
            <p className="text-xl text-gray-500 mb-8">
              We're building something amazing. Our AI Agent marketplace is launching soon with thousands of powerful agents to help you work smarter.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/become-seller"
                className="px-8 py-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition"
              >
                Become a Seller
              </Link>
              <Link
                to="/about"
                className="px-8 py-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-dark-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Why Choose Agent Store</h2>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
              We're committed to providing the best AI Agent marketplace for your productivity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-500/20 text-primary-400 mb-4">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Boost Your Productivity?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Sign up now and discover thousands of AI Agents to help you work smarter
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition shadow-lg"
            >
              Get Started Free
            </Link>
            <Link
              to="/categories"
              className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition"
            >
              Browse Agents
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
