import { useEffect, useRef } from 'react';

interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearDelay?: number;
}

/**
 * Live region component for screen reader announcements
 * Automatically announces messages to screen readers
 */
export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  priority = 'polite',
  clearDelay = 1000,
}) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set timeout to clear message
    if (message && clearDelay > 0) {
      timeoutRef.current = setTimeout(() => {
        // Message will be cleared by next render
      }, clearDelay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearDelay]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};

/**
 * Global live region for application-wide announcements
 */
export const GlobalLiveRegion: React.FC = () => {
  return (
    <>
      {/* Polite announcements */}
      <div
        id="polite-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      {/* Assertive announcements */}
      <div
        id="assertive-announcer"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
};

/**
 * Utility function to announce messages globally
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcerId = priority === 'assertive' ? 'assertive-announcer' : 'polite-announcer';
  const announcer = document.getElementById(announcerId);
  
  if (announcer) {
    announcer.textContent = message;
    
    // Clear after a delay
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }
}
