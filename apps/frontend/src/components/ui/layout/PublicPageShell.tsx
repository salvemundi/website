import React from 'react';
import { Box } from '@mantine/core';

interface PublicPageShellProps {
    title?: string;
    subtitle?: string;
    description?: string;
    backgroundImage?: string;
    backgroundPosition?: string;
    imageFilter?: string;
    backLink?: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    hideHeader?: boolean;
}

export default function PublicPageShell({
    children,
    backgroundImage,
    imageFilter = 'brightness(0.65)',
}: PublicPageShellProps) {
    if (backgroundImage) {
        return (
            <Box pos="relative" mih="100dvh" w="100%" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box
                    pos="absolute"
                    inset={0}
                    style={{
                        zIndex: -10,
                        pointerEvents: 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundImage: `url(${backgroundImage})`,
                        filter: imageFilter,
                    }}
                />
                <Box
                    pos="absolute"
                    inset={0}
                    style={{
                        zIndex: -10,
                        pointerEvents: 'none',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    }}
                />
                <Box pos="relative" style={{ zIndex: 10, flexGrow: 1 }}>
                    {children}
                </Box>
            </Box>
        );
    }

    return (
        <Box mih="100dvh" w="100%">
            {children}
        </Box>
    );
}
