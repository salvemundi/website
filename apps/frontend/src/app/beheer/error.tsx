'use client';

import GlobalError from '@/components/ui/layout/GlobalError';

export default function BeheerError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <GlobalError 
                error={error} 
                reset={reset} 
                title="Beheerderspaneel Fout" 
            />
        </div>
    );
}
