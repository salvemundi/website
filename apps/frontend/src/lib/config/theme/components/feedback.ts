import type { MantineThemeComponents } from '@mantine/core';

export const feedbackComponents = {
    Alert: {
        defaultProps: {
            variant: 'light',
            color: 'brand',
        },
        styles: {
            root: {
                borderColor: 'var(--surface-subtle-border)',
            },
            message: {
                color: 'var(--mantine-color-text)',
            },
        },
    },
    Badge: {
        defaultProps: {
            variant: 'light',
            color: 'brand',
            radius: 'md',
        },
    },
    ThemeIcon: {
        defaultProps: {
            variant: 'light',
            color: 'brand',
        },
    },
    Loader: {
        defaultProps: {
            color: 'brand',
        },
    },
    Progress: {
        defaultProps: {
            color: 'brand',
            radius: 'md',
        },
    },
} satisfies MantineThemeComponents;
