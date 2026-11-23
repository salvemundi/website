import type { MantineThemeComponents } from '@mantine/core';

export const buttonComponents = {
    Button: {
        defaultProps: {
            variant: 'filled',
            color: 'brand',
            fw: 700,
        },
        styles: {
            inner: {
                gap: 'var(--mantine-spacing-xs)',
            },
            section: {
                marginInline: 0,
            },
        },
    },
    ActionIcon: {
        defaultProps: {
            variant: 'subtle',
            color: 'brand',
        },
    },
} satisfies MantineThemeComponents;
