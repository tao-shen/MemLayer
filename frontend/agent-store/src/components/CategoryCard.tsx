import { Link } from 'react-router-dom';
import { Category } from '../types';
import clsx from 'clsx';

interface CategoryCardProps {
  category: Category;
  variant?: 'default' | 'large' | 'compact';
  className?: string;
}

export default function CategoryCard({ category, variant = 'default', className }: CategoryCardProps) {
  if (variant === 'large') {
    return (
      <Link
        to={`/categories/${category.slug}`}
        className={clsx(
          'group relative block overflow-hidden rounded-xl aspect-[4/3]',
          className
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800 group-hover:scale-105 transition-transform duration-300" />
        <div className="relative h-full flex flex-col justify-between p-6 text-white">
          <span className="text-5xl">{category.icon}</span>
          <div>
            <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
            <p className="text-primary-100 text-sm line-clamp-2">{category.description}</p>
            <span className="inline-block mt-3 text-sm font-medium border-b border-white/50 group-hover:border-white transition">
              Browse {category.agentCount} Agents →
            </span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link
        to={`/categories/${category.slug}`}
        className={clsx(
          'group flex items-center p-3 rounded-lg hover:bg-gray-50 transition',
          className
        )}
      >
        <span className="text-2xl mr-3">{category.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-900 font-medium group-hover:text-primary-500 transition truncate">
            {category.name}
          </h3>
          <p className="text-sm text-gray-500">{category.agentCount} Agents</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/categories/${category.slug}`}
      className={clsx(
        'group block p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-500 hover:shadow-lg transition-all duration-300',
        className
      )}
    >
      <span className="text-4xl mb-4 block">{category.icon}</span>
      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-500 transition mb-2">
        {category.name}
      </h3>
      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{category.description}</p>
      <span className="text-sm text-gray-400">{category.agentCount} Agents</span>
    </Link>
  );
}
