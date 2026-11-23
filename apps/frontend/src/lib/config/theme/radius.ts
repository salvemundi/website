import type { MantineRadiusValues } from '@mantine/core';

export const RADIUS_BASE = 'clamp(0.75rem, 0.6rem + 0.5vw, 1rem)';

const scale = (factor: number): string => `calc(var(--radius-base) * ${factor})`;

export const themeRadius: Partial<MantineRadiusValues> = {
    xs: scale(0.25),
    sm: scale(0.5),
    md: scale(1),
    lg: scale(1.5),
    xl: scale(2),
};
