'use client';

import ErrorWrapper from '@/components/ui/ErrorWrapper';

export default function SecureError({
    error,
    reset }: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <ErrorWrapper 
            error={error} 
            reset={reset} 
            title="Ledenomgeving Fout" 
        />
    );
}
