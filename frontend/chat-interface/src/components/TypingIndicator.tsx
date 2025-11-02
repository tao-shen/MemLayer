import { useEffect, useState } from 'react';

interface TypingIndicatorProps {
  streamingText?: string | null;
  isTyping?: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  streamingText,
  isTyping = false,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Stream text character by character
  useEffect(() => {
    if (streamingText) {
      if (currentIndex < streamingText.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(streamingText.substring(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        }, 20); // 20ms per character for smooth streaming

        return () => clearTimeout(timeout);
      }
    } else {
      setDisplayedText('');
      setCurrentIndex(0);
    }
  }, [streamingText, currentIndex]);

  if (!isTyping && !streamingText) {
    return null;
  }

  return (
    <div className="flex gap-3 p-4 bg-white dark:bg-gray-900">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm font-medium text-white">
          AI
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
            AI Assistant
          </span>
        </div>

        {streamingText ? (
          // Streaming text display
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="text-gray-900 dark:text-gray-100">
              {displayedText}
              <span className="inline-block w-2 h-4 ml-1 bg-primary-600 animate-pulse" />
            </div>
          </div>
        ) : (
          // Typing animation (dots)
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              AI is typing
            </span>
            <div className="flex gap-1 ml-2">
              <span className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
