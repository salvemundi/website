'use client';

import { Box, Paper } from '@mantine/core';

export default function ToastWrapper({ children, visible }: { children: React.ReactNode; visible: boolean }) {
    return (
        <Box
            role="dialog"
            aria-modal="false"
            aria-label="App installeren"
            pos="fixed"
            bottom={24}
            left="50%"
            style={{
                transform: 'translateX(-50%)',
                zIndex: 9999,
                width: 'min(calc(100vw - 2rem), 440px)',
                pointerEvents: visible ? 'auto' : 'none',
                opacity: visible ? 1 : 0,
            }}
        >
            <Paper
                shadow="xl"
                bg="var(--mantine-color-default)"
                style={{
                    border: '1px solid var(--mantine-color-default-border)',
                    overflow: 'hidden',
                }}
            >
                {children}
            </Paper>
        </Box>
    );
}
