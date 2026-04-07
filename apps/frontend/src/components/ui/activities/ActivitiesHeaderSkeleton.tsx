import { Skeleton } from '../Skeleton';

export default function ActivitiesHeaderSkeleton() {
    return (
        <div className="relative flex items-center justify-center mb-5 w-full bg-[var(--bg-soft)]" style={{ minHeight: '300px' }}>
            <div className="relative z-20 w-full max-w-app px-4 py-20 text-center">
                <Skeleton className="h-12 md:h-16 w-3/4 max-w-md mx-auto mb-4" variant="purple" rounded="lg" />
                <Skeleton className="h-6 w-5/6 max-w-lg mx-auto" variant="purple" rounded="lg" />
            </div>
        </div>
    );
}

