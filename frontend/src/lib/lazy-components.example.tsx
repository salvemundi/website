/**
 * Example: How to lazy load heavy components
 * 
 * Use this pattern for:
 * - Swiper/Carousel components
 * - Map components (Leaflet, MapLibre)
 * - Rich text editors
 * - PDF viewers
 * - Charts/Graphs
 * - Analytics libraries
 */

import dynamic from 'next/dynamic';

// Example 1: Lazy load Swiper with loading state
export const LazySwiper = dynamic(
  () => import('swiper/react').then(mod => ({ default: mod.Swiper })),
  {
    loading: () => (
      <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-slate-500">Loading carousel...</p>
      </div>
    ),
    ssr: false, // Disable server-side rendering for client-only components
  }
);

// Example 2: Lazy load Map component
// Replace 'YourMapComponent' with your actual map component path
export const LazyMap = dynamic(
  () => import('react').then(() => ({ 
    default: () => <div>Map placeholder - replace with actual component</div> 
  })),
  {
    loading: () => (
      <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-slate-500">Loading map...</p>
      </div>
    ),
    ssr: false,
  }
);

// Example 3: Lazy load PostHog analytics
export const initializeAnalytics = async () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Wait 3 seconds before loading analytics to prioritize critical content
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const posthog = await import('posthog-js');
    posthog.default.init(
      process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
      {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') posthog.debug();
        },
      }
    );
  }
};

// Example 4: Lazy load heavy Radix UI components
export const LazyDialog = dynamic(
  () => import('@radix-ui/react-dialog').then(mod => ({ default: mod.Dialog })),
  { ssr: false }
);

/**
 * Usage in your components:
 * 
 * import { LazySwiper, LazyMap } from '@/lib/lazy-components';
 * 
 * function MyComponent() {
 *   return (
 *     <div>
 *       <LazySwiper>
 *         // Swiper slides here
 *       </LazySwiper>
 *     </div>
 *   );
 * }
 */
