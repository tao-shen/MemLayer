interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const SIZES = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const COLORS = {
  primary: 'bg-primary-600 dark:bg-primary-500',
  success: 'bg-green-600 dark:bg-green-500',
  warning: 'bg-orange-600 dark:bg-orange-500',
  error: 'bg-red-600 dark:bg-red-500',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  label,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showLabel && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${SIZES[size]}`}>
        <div
          className={`${COLORS[color]} ${SIZES[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Indeterminate progress bar (for unknown duration)
export const IndeterminateProgressBar: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}> = ({ size = 'md', color = 'primary', className = '' }) => {
  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${SIZES[size]} ${className}`}>
      <div
        className={`${COLORS[color]} ${SIZES[size]} rounded-full animate-progress`}
        style={{
          width: '30%',
          animation: 'progress 1.5s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  );
};
