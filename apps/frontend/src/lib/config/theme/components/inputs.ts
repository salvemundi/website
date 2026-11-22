import type { MantineThemeComponents } from '@mantine/core';

export const inputComponents = {
    Switch: {
        defaultProps: {
            color: 'brand',
            size: 'sm',
        },
        styles: {
            track: {
                borderColor: 'var(--surface-subtle-border)',
            },
        },
    },
    Checkbox: {
        defaultProps: {
            color: 'brand',
        },
    },
    Radio: {
        defaultProps: {
            color: 'brand',
        },
    },
    SegmentedControl: {
        defaultProps: {
            color: 'brand',
        },
        styles: {
            root: {
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--surface-subtle-border)',
            },
            label: {
                fontWeight: 700,
            },
        },
    },
} satisfies MantineThemeComponents;
