import React from 'react';

export const IntroContentSkeleton = () => {
    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 max-w-7xl mx-auto w-full animate-pulse">
            {/* Linker kolom: Info content */}
            <div className="flex-1">
                <div className="h-8 lg:h-10 w-3/4 bg-white/10 rounded mb-4"></div>
                <div className="space-y-3 mb-6">
                    <div className="h-4 lg:h-5 w-full bg-white/10 rounded"></div>
                    <div className="h-4 lg:h-5 w-5/6 bg-white/10 rounded"></div>
                    <div className="h-4 lg:h-5 w-11/12 bg-white/10 rounded"></div>
                </div>

                <div className="h-6 w-1/2 bg-white/10 rounded mb-3"></div>
                <div className="space-y-2 mb-6">
                    <div className="h-4 w-full bg-white/10 rounded"></div>
                    <div className="h-4 w-4/5 bg-white/10 rounded"></div>
                </div>

                {/* Cursors/Images grid */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-full h-32 bg-white/5 rounded-lg"></div>
                    ))}
                </div>
            </div>

            {/* Rechter kolom: Form */}
            <div className="flex-1 w-full">
                <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-lg space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-theme-purple/30 rounded-full"></div>
                        <div className="h-6 w-1/3 bg-theme-purple/20 rounded"></div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="h-4 w-1/4 bg-white/10 rounded mb-2"></div>
                            <div className="h-10 w-full bg-white/5 rounded-md"></div>
                        </div>
                        <div>
                            <div className="h-4 w-1/3 bg-white/10 rounded mb-2"></div>
                            <div className="h-10 w-full bg-white/5 rounded-md"></div>
                        </div>
                        <div>
                            <div className="h-4 w-1/4 bg-white/10 rounded mb-2"></div>
                            <div className="h-10 w-full bg-white/5 rounded-md"></div>
                        </div>
                    </div>

                    <div className="h-12 w-full bg-theme-purple/50 rounded-md mt-6"></div>
                </div>
            </div>
        </div>
    );
};
