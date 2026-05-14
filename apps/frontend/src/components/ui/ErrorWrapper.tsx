'use client';

import GlobalError from '@/components/ui/layout/GlobalError';

interface ErrorWrapperProps {
    error: Error & { digest?: string };
    reset: () => void;
    title: string;
    className?: string;
}

export default function ErrorWrapper({
    error,
    reset,
    title,
    className = "mx-auto max-w-app px-4 py-12 sm:px-6 lg:px-8"
}: ErrorWrapperProps) {
    return (
        <div className={className}>
            <GlobalError 
                error={error} 
                reset={reset} 
                title={title} 
            />
        </div>
    );
}
