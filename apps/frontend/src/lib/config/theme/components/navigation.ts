import type { MantineThemeComponents } from '@mantine/core';

export const navigationComponents = {
    Tabs: {
        defaultProps: {
            color: 'brand',
            variant: 'pills',
        },
        styles: {
            tab: {
                fontWeight: 700,
            },
        },
    },
    NavLink: {
        defaultProps: {
            color: 'brand',
        },
    },
} satisfies MantineThemeComponents;
