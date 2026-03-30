import { Loader2 } from 'lucide-react';

export default function AdminDashboardSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
            {/* Statistics Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm p-4 sm:p-6 border-l-4 border-[var(--beheer-border)] animate-pulse">
                        <div className="flex items-center justify-between">
                            <div className="w-full">
                                <div className="h-3 bg-[var(--beheer-border)]/50 rounded w-1/2 mb-2"></div>
                                <div className="h-6 bg-[var(--beheer-border)] rounded w-1/3"></div>
                            </div>
                            <div className="h-8 w-8 bg-[var(--beheer-border)]/50 rounded-2xl"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions & Filters Skeleton */}
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between mb-10 animate-pulse">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="h-12 w-48 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-full"></div>
                    <div className="h-10 w-24 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-full hidden md:block"></div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto overflow-hidden">
                    <div className="h-10 w-24 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-full"></div>
                    <div className="h-10 w-24 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-full"></div>
                    <div className="h-10 w-24 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-full"></div>
                </div>
            </div>

            {/* Search Bar Skeleton */}
            <div className="mb-10 max-w-md animate-pulse">
                <div className="h-14 w-full bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-full"></div>
            </div>

            {/* List/Table Content Skeleton */}
            <div className="space-y-6 relative">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div 
                        key={i} 
                        className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] p-6 border border-[var(--beheer-border)] shadow-sm animate-pulse"
                    >
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Image Placeholder */}
                            <div className="h-24 w-24 sm:h-28 sm:w-28 bg-[var(--beheer-border)]/10 rounded-[var(--radius-2xl)] flex-shrink-0" />
                            
                            {/* Content Placeholder */}
                            <div className="flex-1 space-y-4">
                                <div className="h-6 bg-[var(--beheer-border)]/50 rounded w-1/3"></div>
                                <div className="flex gap-4">
                                    <div className="h-4 bg-[var(--beheer-border)]/30 rounded w-24"></div>
                                    <div className="h-4 bg-[var(--beheer-border)]/30 rounded w-32"></div>
                                </div>
                                <div className="h-4 bg-[var(--beheer-border)]/20 rounded w-3/4"></div>
                                <div className="flex gap-3">
                                    <div className="h-8 bg-[var(--beheer-border)]/20 rounded-full w-20"></div>
                                    <div className="h-8 bg-[var(--beheer-border)]/20 rounded-full w-24"></div>
                                </div>
                            </div>
                            
                            {/* Actions Placeholder */}
                            <div className="flex flex-row md:flex-col gap-2 justify-end">
                                <div className="h-10 w-28 bg-[var(--beheer-border)]/20 rounded-xl"></div>
                                <div className="h-10 w-28 bg-[var(--beheer-border)]/20 rounded-xl"></div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Central Spinner */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Loader2 className="h-10 w-10 animate-spin text-[var(--beheer-accent)] opacity-20" />
                </div>
            </div>
        </div>
    );
}
