'use client';

import GlobalError from '@/components/ui/layout/GlobalError';

export default function SecureError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="mx-auto max-w-app px-4 py-12 sm:px-6 lg:px-8">
            <GlobalError 
                error={error} 
                reset={reset} 
                title="Ledenomgeving Fout" 
            />
        </div>
    );
}
