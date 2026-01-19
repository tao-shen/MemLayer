import { Link } from 'react-router-dom';
import { HeartIcon, StarIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import { Agent } from '../types';
import { useUserStore } from '../stores';
import clsx from 'clsx';

interface AgentCardProps {
  agent: Agent;
  className?: string;
}

export default function AgentCard({ agent, className }: AgentCardProps) {
  const { isFavorite, toggleFavorite, isAuthenticated } = useUserStore();
  const favorite = isFavorite(agent.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      toggleFavorite(agent.id);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link
      to={`/agent/${agent.id}`}
      className={clsx(
        'group block bg-white rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={agent.thumbnail}
          alt={agent.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white transition shadow-sm"
        >
          {favorite ? (
            <HeartIcon className="h-5 w-5 text-red-500" />
          ) : (
            <HeartOutlineIcon className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {agent.isTopRated && (
            <span className="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded">
              Top Rated
            </span>
          )}
          {agent.isProSeller && (
            <span className="px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded">
              Pro Seller
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Seller Info */}
        <div className="flex items-center mb-2">
          <img
            src={agent.seller.avatar}
            alt={agent.seller.displayName}
            className="w-6 h-6 rounded-full mr-2"
          />
          <span className="text-sm text-gray-600">{agent.seller.displayName}</span>
          {agent.seller.level === 'topRated' && (
            <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
              Top
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-gray-900 font-medium line-clamp-2 group-hover:text-primary-500 transition mb-2">
          {agent.title}
        </h3>

        {/* Rating */}
        <div className="flex items-center mb-3">
          <StarIcon className="h-4 w-4 text-amber-400" />
          <span className="ml-1 text-sm font-medium text-gray-900">{agent.rating}</span>
          <span className="ml-1 text-sm text-gray-500">({agent.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500 uppercase">Starting at</span>
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(agent.pricing.startingPrice)}
          </span>
        </div>
      </div>
    </Link>
  );
}
