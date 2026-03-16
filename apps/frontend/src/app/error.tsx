'use client';

import GlobalError from '@/components/ui/layout/GlobalError';

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return <GlobalError error={error} reset={reset} />;
}
