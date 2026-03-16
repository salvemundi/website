import LoadingSpinner from '@/components/ui/layout/LoadingSpinner';

export default function RootLoading() {
    return (
        <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-4">
            <LoadingSpinner size={64} />
            <p className="animate-pulse text-sm font-medium text-[var(--text-muted)] tracking-widest uppercase">
                Even geduld...
            </p>
        </div>
    );
}
