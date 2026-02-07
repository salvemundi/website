/**
 * Lazy-loaded heavy components
 * 
 * This module provides dynamically imported versions of heavy components
 * that include large libraries like Swiper, GSAP, etc.
 * 
 * Use these lazy versions to reduce initial bundle size on pages
 * that don't need these components immediately.
 */

import dynamic from 'next/dynamic';

// Lazy load Hero component (includes Swiper + GSAP)
// Only needed on homepage, so lazy load to reduce bundle size on other pages
export const LazyHero = dynamic(
  () => import('@/widgets/hero/ui/Hero'),
  {
    ssr: false,
    loading: () => (
      <section className="relative bg-[var(--bg-main)] overflow-hidden w-full min-h-[450px] md:min-h-[500px] py-4 sm:py-8 lg:py-12">
        <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2 md:gap-10 lg:gap-16 xl:gap-20 md:items-center">
            <div className="space-y-5 sm:space-y-6 md:space-y-8 lg:space-y-10">
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="h-12 sm:h-16 md:h-20 w-3/4 bg-theme-purple/10 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-4 sm:h-5 w-full bg-theme-purple/10 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-4 sm:h-5 w-5/6 bg-theme-purple/10 dark:bg-white/10 rounded animate-pulse" />
              </div>
              <div className="h-24 sm:h-28 w-full bg-theme-purple/5 dark:bg-white/5 rounded-2xl animate-pulse" />
            </div>
            <div className="h-[240px] sm:h-[280px] md:h-[350px] lg:h-[480px] xl:h-[540px] bg-theme-purple/5 dark:bg-white/5 rounded-2xl animate-pulse" />
          </div>
        </div>
      </section>
    ),
  }
);

// Lazy load ScrollTriggerWrapper (includes GSAP ScrollTrigger)
// Used for scroll animations - can be lazy loaded since animations aren't critical for initial paint
export const LazyScrollTriggerWrapper = dynamic(
  () => import('@/shared/ui/ScrollTriggerWrapper').then(m => ({ default: m.ScrollTriggerWrapper })),
  { 
    ssr: false,
    loading: () => null,
  }
);
