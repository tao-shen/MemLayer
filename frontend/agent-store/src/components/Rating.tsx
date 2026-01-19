import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface RatingProps {
  rating: number;
  reviewCount?: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Rating({ 
  rating, 
  reviewCount, 
  showCount = true, 
  size = 'md',
  className 
}: RatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={clsx('flex items-center', className)}>
      <div className="flex">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <StarIcon key={`full-${i}`} className={clsx(sizeClasses[size], 'text-amber-400')} />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <StarOutlineIcon className={clsx(sizeClasses[size], 'text-amber-400')} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <StarIcon className={clsx(sizeClasses[size], 'text-amber-400')} />
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <StarOutlineIcon key={`empty-${i}`} className={clsx(sizeClasses[size], 'text-gray-300')} />
        ))}
      </div>

      <span className={clsx('ml-1 font-medium text-gray-900', textSizeClasses[size])}>
        {rating.toFixed(1)}
      </span>

      {showCount && reviewCount !== undefined && (
        <span className={clsx('ml-1 text-gray-500', textSizeClasses[size])}>
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  );
}
