import type { MantineThemeComponents } from '@mantine/core';

export const surfaceComponents = {
    Container: {
        defaultProps: {
            size: 'xl',
            py: 'xl',
            w: '100%',
        },
    },
    Group: {
        defaultProps: {
            preventGrowOverflow: false,
        },
    },
    Card: {
        defaultProps: {
            padding: 'lg',
            shadow: 'md',
            withBorder: false,
            bg: 'var(--mantine-color-default)',
        },
    },
    ScrollArea: {
        defaultProps: {
            scrollbarSize: 6,
            type: 'auto',
        },
        styles: {
            scrollbar: {
                backgroundColor: 'transparent',
            },
            thumb: {
                backgroundColor: 'color-mix(in srgb, var(--mantine-color-brand-filled) 55%, transparent)',
            },
        },
    },
} satisfies MantineThemeComponents;
