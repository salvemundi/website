import { createTheme } from '@mantine/core';
import { BRAND_COLORS } from './brand';
import { themeColors } from './colors';
import { themeComponents } from './components';
import { themeRadius } from './radius';

export { BRAND_COLORS } from './brand';
export { salveMundiCssResolver } from './resolver';

const FONT_FAMILY = 'var(--font-poppins)';

export const salveMundiTheme = createTheme({
    white: BRAND_COLORS.lightSurface,
    black: BRAND_COLORS.darkBase,
    colors: themeColors,
    primaryColor: 'brand',
    fontFamily: FONT_FAMILY,
    fontFamilyMonospace: FONT_FAMILY,
    headings: {
        fontFamily: FONT_FAMILY,
        fontWeight: '900',
    },
    radius: themeRadius,
    defaultRadius: 'md',
    components: themeComponents,
});
