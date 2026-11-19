'use client';

import { Box } from '@mantine/core';
import GlobalError from '@/components/ui/layout/GlobalError';

interface ErrorWrapperProps {
    error: Error & { digest?: string };
    reset: () => void;
    title: string;
}

export default function ErrorWrapper({
    error,
    reset,
    title,
}: ErrorWrapperProps) {
    return (
        <Box maw="var(--max-w-app)" mx="auto" px={{ base: 'md', sm: 'lg', lg: 'xl' }} py={{ base: 'lg', sm: 'xl' }}>
            <GlobalError 
                error={error} 
                reset={reset} 
                title={title} 
            />
        </Box>
    );
}
