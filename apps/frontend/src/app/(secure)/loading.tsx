import { ProfielSkeleton } from '@/components/ui/account/ProfielSkeleton';

export default function SecureLoading() {
    return (
        <div className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8 opacity-50">
                <div className="h-4 w-24 bg-[var(--bg-card)] rounded mb-2 animate-pulse" />
                <div className="h-10 w-48 bg-[var(--bg-card)] rounded animate-pulse" />
            </div>
            <ProfielSkeleton />
        </div>
    );
}
