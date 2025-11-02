import { useEffect, useRef } from 'react';
import { useThrottledCallback } from './useThrottle';

/**
 * Hook to throttle scroll events
 * @param callback - Function to call on scroll
 * @param delay - Throttle delay in milliseconds (default: 100ms)
 * @param element - Element to attach scroll listener to (default: window)
 */
export function useScrollThrottle(
  callback: (event: Event) => void,
  delay: number = 100,
  element?: HTMLElement | null
): void {
  const throttledCallback = useThrottledCallback(callback, delay);
  const elementRef = useRef(element);

  useEffect(() => {
    elementRef.current = element;
  }, [element]);

  useEffect(() => {
    const target = elementRef.current || window;

    target.addEventListener('scroll', throttledCallback as EventListener);

    return () => {
      target.removeEventListener('scroll', throttledCallback as EventListener);
    };
  }, [throttledCallback]);
}

/**
 * Hook to throttle window resize events
 * @param callback - Function to call on resize
 * @param delay - Throttle delay in milliseconds (default: 200ms)
 */
export function useResizeThrottle(
  callback: (event: Event) => void,
  delay: number = 200
): void {
  const throttledCallback = useThrottledCallback(callback, delay);

  useEffect(() => {
    window.addEventListener('resize', throttledCallback as EventListener);

    return () => {
      window.removeEventListener('resize', throttledCallback as EventListener);
    };
  }, [throttledCallback]);
}
