// OG-image route voor de Oud-Besturen pagina
import { generateGradientOGImage } from '@/lib/utils/og-utils';

export const alt = 'Oud-Besturen - Salve Mundi';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    return generateGradientOGImage({
        title: 'Oud-Besturen',
        subtitle: 'Een overzicht van alle voorgaande besturen die hun steentje hebben bijgedragen aan Salve Mundi.',
        category: 'Oud-Besturen'
    });
}

