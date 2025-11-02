import { useState, useEffect } from 'react';

// Tailwind breakpoints
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to get the current breakpoint
 * @returns Current breakpoint name
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'lg';
    
    const width = window.innerWidth;
    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    return 'sm';
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newBreakpoint: Breakpoint = 'sm';

      if (width >= breakpoints['2xl']) {
        newBreakpoint = '2xl';
      } else if (width >= breakpoints.xl) {
        newBreakpoint = 'xl';
      } else if (width >= breakpoints.lg) {
        newBreakpoint = 'lg';
      } else if (width >= breakpoints.md) {
        newBreakpoint = 'md';
      }

      if (newBreakpoint !== breakpoint) {
        setBreakpoint(newBreakpoint);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return breakpoint;
}

/**
 * Hook to check if current viewport is at or above a breakpoint
 * @param minBreakpoint - Minimum breakpoint to check
 * @returns True if viewport is at or above the breakpoint
 */
export function useMediaQuery(minBreakpoint: Breakpoint): boolean {
  const currentBreakpoint = useBreakpoint();
  const breakpointOrder: Breakpoint[] = ['sm', 'md', 'lg', 'xl', '2xl'];
  
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  const minIndex = breakpointOrder.indexOf(minBreakpoint);
  
  return currentIndex >= minIndex;
}

/**
 * Hook to check if viewport is mobile (< md breakpoint)
 * @returns True if viewport is mobile
 */
export function useIsMobile(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'sm';
}

/**
 * Hook to check if viewport is tablet (md breakpoint)
 * @returns True if viewport is tablet
 */
export function useIsTablet(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'md';
}

/**
 * Hook to check if viewport is desktop (>= lg breakpoint)
 * @returns True if viewport is desktop
 */
export function useIsDesktop(): boolean {
  const breakpoint = useBreakpoint();
  return ['lg', 'xl', '2xl'].includes(breakpoint);
}
