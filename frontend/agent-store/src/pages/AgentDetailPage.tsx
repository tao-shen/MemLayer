import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ChevronRightIcon, 
  HeartIcon, 
  ShareIcon,
  ClockIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { Rating } from '../components';
import { agents, reviews } from '../data/mockData';
import { useUserStore, useCartStore } from '../stores';
import clsx from 'clsx';

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedPackage, setSelectedPackage] = useState<'basic' | 'standard' | 'premium'>('basic');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const { isFavorite, toggleFavorite, isAuthenticated } = useUserStore();
  const { addItem } = useCartStore();

  const agent = agents.find(a => a.id === id);

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Agent not found</h1>
          <Link to="/" className="text-primary-500 mt-4 inline-block">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const currentPackage = agent.packages.find(p => p.name === selectedPackage) || agent.packages[0];
  const agentReviews = reviews.filter(r => r.agentId === agent.id);
  const favorite = isFavorite(agent.id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    addItem(agent.id, currentPackage.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center text-sm text-gray-500">
            <Link to="/" className="hover:text-primary-500">Home</Link>
            <ChevronRightIcon className="h-4 w-4 mx-2" />
            <Link to={`/categories/${agent.category.slug}`} className="hover:text-primary-500">
              {agent.category.name}
            </Link>
            <ChevronRightIcon className="h-4 w-4 mx-2" />
            <span className="text-gray-900 truncate max-w-xs">{agent.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title Section */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {agent.title}
              </h1>
              
              {/* Seller Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Link to={`/seller/${agent.seller.username}`} className="flex items-center">
                    <img
                      src={agent.seller.avatar}
                      alt={agent.seller.displayName}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                      <span className="font-medium text-gray-900 hover:text-primary-500">
                        {agent.seller.displayName}
                      </span>
                      {agent.seller.level === 'topRated' && (
                        <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                          Top Rated
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
                <Rating rating={agent.rating} reviewCount={agent.reviewCount} size="lg" />
              </div>
            </div>

            {/* Image Gallery */}
            <div>
              <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden mb-4">
                <img
                  src={agent.images[currentImageIndex]}
                  alt={agent.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {agent.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {agent.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={clsx(
                        'flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition',
                        currentImageIndex === index 
                          ? 'border-primary-500' 
                          : 'border-transparent opacity-70 hover:opacity-100'
                      )}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Service</h2>
              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-wrap text-gray-600">
                  {agent.description}
                </div>
              </div>
            </div>

            {/* Seller Info Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About The Seller</h2>
              
              <div className="flex items-start gap-4">
                <img
                  src={agent.seller.avatar}
                  alt={agent.seller.displayName}
                  className="w-20 h-20 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{agent.seller.displayName}</span>
                    {agent.seller.isOnline && (
                      <span className="flex items-center text-green-500 text-sm">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                        Online
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mb-3">{agent.seller.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">From</span>
                      <p className="font-medium text-gray-900">{agent.seller.country}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Avg. Response Time</span>
                      <p className="font-medium text-gray-900">{agent.seller.responseTime}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Delivery</span>
                      <p className="font-medium text-gray-900">{agent.seller.lastDelivery}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Languages</span>
                      <p className="font-medium text-gray-900">{agent.seller.languages.join(', ')}</p>
                    </div>
                  </div>
                  
                  <button className="mt-4 w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
                    Contact Seller
                  </button>
                </div>
              </div>
            </div>

            {/* FAQ */}
            {agent.faqs.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">FAQ</h2>
                <div className="space-y-3">
                  {agent.faqs.map((faq, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left"
                      >
                        <span className="font-medium text-gray-900">{faq.question}</span>
                        <ChevronRightIcon 
                          className={clsx(
                            'h-5 w-5 text-gray-400 transition-transform',
                            expandedFaq === index && 'rotate-90'
                          )} 
                        />
                      </button>
                      {expandedFaq === index && (
                        <div className="px-4 pb-3 text-gray-600">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Reviews</h2>
                <span className="text-gray-500">{agent.reviewCount} reviews</span>
              </div>

              {/* Rating Summary */}
              <div className="flex items-center gap-8 pb-6 mb-6 border-b border-gray-200">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900">{agent.rating}</div>
                  <Rating rating={agent.rating} showCount={false} size="lg" className="mt-2" />
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 w-12">{stars} Stars</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${stars === 5 ? 80 : stars === 4 ? 15 : 5}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review List */}
              <div className="space-y-6">
                {agentReviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                    <div className="flex items-start gap-3">
                      <img
                        src={review.buyer.avatar}
                        alt={review.buyer.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{review.buyer.username}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-500">{review.buyer.country}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Rating rating={review.rating} showCount={false} size="sm" />
                          <span className="text-sm text-gray-400">{review.createdAt}</span>
                        </div>
                        <p className="mt-3 text-gray-600">{review.comment}</p>
                        
                        {review.sellerResponse && (
                          <div className="mt-4 pl-4 border-l-2 border-gray-200">
                            <p className="text-sm font-medium text-gray-500">Seller Response:</p>
                            <p className="mt-1 text-gray-600">{review.sellerResponse.comment}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="mt-6 w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
                See All {agent.reviewCount} Reviews
              </button>
            </div>
          </div>

          {/* Right Column - Pricing */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Package Selector */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Package Tabs */}
                <div className="flex border-b border-gray-200">
                  {(['basic', 'standard', 'premium'] as const).map((pkg) => {
                    const packageData = agent.packages.find(p => p.name === pkg);
                    if (!packageData) return null;
                    return (
                      <button
                        key={pkg}
                        onClick={() => setSelectedPackage(pkg)}
                        className={clsx(
                          'flex-1 py-3 text-sm font-medium transition',
                          selectedPackage === pkg
                            ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                            : 'text-gray-500 hover:text-gray-700'
                        )}
                      >
                        {packageData.title}
                      </button>
                    );
                  })}
                </div>

                {/* Package Details */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(currentPackage.price)}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4">{currentPackage.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                    <span className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {currentPackage.deliveryTime} day delivery
                    </span>
                    <span className="flex items-center">
                      <ArrowPathIcon className="h-4 w-4 mr-1" />
                      {currentPackage.revisions === 'unlimited' ? 'Unlimited' : currentPackage.revisions} revisions
                    </span>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {currentPackage.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {feature.included ? (
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <XMarkIcon className="h-4 w-4 text-gray-300" />
                        )}
                        <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                          {feature.name}
                          {feature.value && <span className="font-medium ml-1">({feature.value})</span>}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="w-full py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition"
                  >
                    Continue ({formatPrice(currentPackage.price)})
                  </button>

                  <button className="w-full py-3 mt-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition">
                    Contact Seller
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => isAuthenticated && toggleFavorite(agent.id)}
                  className="flex-1 flex items-center justify-center py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  {favorite ? (
                    <HeartSolidIcon className="h-5 w-5 text-red-500 mr-2" />
                  ) : (
                    <HeartIcon className="h-5 w-5 text-gray-400 mr-2" />
                  )}
                  <span className="text-gray-700">Save</span>
                </button>
                <button className="flex-1 flex items-center justify-center py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <ShareIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-700">Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
