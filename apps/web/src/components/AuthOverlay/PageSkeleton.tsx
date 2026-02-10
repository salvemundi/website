'use client';

/**
 * PageSkeleton Component
 * Generic loading skeleton for pages during auth checks
 * Matches the site's existing UI structure
 */
export default function PageSkeleton() {
    return (
        <div className="min-h-screen animate-pulse">
            {/* Header Skeleton */}
            <div className="h-16 lg:h-20 bg-gray-200 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700" />

            {/* Hero Banner Skeleton (similar to HeroBanner component) */}
            <div className="container mx-auto px-4 py-6 lg:py-8">
                <div className="relative w-full overflow-hidden rounded-2xl lg:rounded-3xl shadow-2xl mb-8 lg:mb-12 h-64 sm:h-80 lg:h-96 bg-gradient-to-t from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />

                {/* Content Area Skeleton */}
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Title */}
                    <div className="h-8 lg:h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-3/4" />

                    {/* Paragraph blocks */}
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/5" />
                    </div>

                    {/* Card/Section blocks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
