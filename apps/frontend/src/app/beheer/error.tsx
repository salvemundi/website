'use client';

import ErrorWrapper from '@/components/ui/ErrorWrapper';

export default function BeheerError({
    error,
    reset }: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <ErrorWrapper 
            error={error} 
            reset={reset} 
            title="Beheerderspaneel Fout" 
            className="p-4 sm:p-6 lg:p-8"
        />
    );
}
