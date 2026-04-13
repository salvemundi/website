import LoadingSpinner from '@/components/ui/layout/LoadingSpinner';

export default function RootLoading() {
    return (
        <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-6 animate-in fade-in duration-1000">
            <div className="relative">
                <LoadingSpinner size={48} />
                <div className="absolute inset-0 blur-2xl bg-[var(--color-purple-500)]/10 -z-10 rounded-full" />
            </div>
            <div className="text-center space-y-2">
                <p className="text-[10px] font-black text-[var(--text-muted)] tracking-[0.3em] uppercase opacity-40">
                    Salve Mundi V7
                </p>
            </div>
        </div>
    );
}
