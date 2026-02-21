export const MembershipSkeleton = () => {
    return (
        <div className="flex flex-col sm:flex-row gap-6 animate-pulse">
            <section className="w-full sm:w-1/2 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-lg p-6 sm:p-8">
                <div className="h-8 w-48 bg-theme-purple/10 rounded-lg mb-6"></div>
                <div className="space-y-4">
                    <div className="h-4 w-full bg-theme-purple/5 rounded"></div>
                    <div className="h-4 w-5/6 bg-theme-purple/5 rounded"></div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="h-10 bg-theme-purple/5 rounded-xl"></div>
                        <div className="h-10 bg-theme-purple/5 rounded-xl"></div>
                    </div>
                    <div className="h-10 w-full bg-theme-purple/5 rounded-xl mt-4"></div>
                </div>
            </section>

            <section className="w-full sm:w-1/2 flex flex-col gap-6">
                <div className="h-40 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl p-6">
                    <div className="h-6 w-32 bg-theme-purple/10 rounded mb-4 mx-auto"></div>
                    <div className="space-y-2">
                        <div className="h-3 w-full bg-theme-purple/5 rounded"></div>
                        <div className="h-3 w-11/12 bg-theme-purple/5 rounded"></div>
                        <div className="h-3 w-4/5 bg-theme-purple/5 rounded"></div>
                    </div>
                </div>
            </section>
        </div>
    );
};
