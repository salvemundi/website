import { colorsTuple, virtualColor, type MantineThemeColorsOverride } from '@mantine/core';
import { BRAND_COLORS } from './brand';

export const themeColors: MantineThemeColorsOverride = {
    purple: colorsTuple(BRAND_COLORS.purple),
    lightPurple: colorsTuple(BRAND_COLORS.lightPurple),
    accent: colorsTuple(BRAND_COLORS.accent),
    success: colorsTuple(BRAND_COLORS.success),
    error: colorsTuple(BRAND_COLORS.error),
    darkSurface: colorsTuple(BRAND_COLORS.darkSurface),
    darkBase: colorsTuple(BRAND_COLORS.darkBase),
    lightBase: colorsTuple(BRAND_COLORS.lightBase),
    brand: virtualColor({
        name: 'brand',
        dark: 'lightPurple',
        light: 'purple',
    }),
    dark: [
        BRAND_COLORS.lightBase,
        BRAND_COLORS.lightBase,
        BRAND_COLORS.lightPurple,
        BRAND_COLORS.lightPurple,
        BRAND_COLORS.purple,
        BRAND_COLORS.purple,
        BRAND_COLORS.darkSurface,
        BRAND_COLORS.darkBase,
        BRAND_COLORS.darkBase,
        BRAND_COLORS.darkBase,
    ],
    gray: [
        BRAND_COLORS.lightBase,
        BRAND_COLORS.lightBase,
        BRAND_COLORS.lightBase,
        BRAND_COLORS.lightPurple,
        BRAND_COLORS.lightPurple,
        BRAND_COLORS.purple,
        BRAND_COLORS.purple,
        BRAND_COLORS.darkSurface,
        BRAND_COLORS.darkBase,
        BRAND_COLORS.darkBase,
    ],
};
