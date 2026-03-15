export default function ActivitiesHeaderSkeleton() {
    return (
        <div className="relative flex items-center justify-center mb-5 w-full bg-[var(--bg-soft)] animate-pulse" style={{ minHeight: '300px' }}>
            <div className="relative z-20 w-full max-w-app px-4 py-20 text-center">
                <div className="h-12 md:h-16 w-3/4 max-w-md mx-auto bg-[var(--color-purple-100)] rounded-lg mb-4" />
                <div className="h-6 w-5/6 max-w-lg mx-auto bg-[var(--color-purple-100)] rounded-lg" />
            </div>
        </div>
    );
}
