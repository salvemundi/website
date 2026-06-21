// OG-image route voor de contactpagina
import { generateGradientOGImage } from '@/lib/utils/og-utils';

export const alt = 'Contact - Salve Mundi';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    return generateGradientOGImage({
        title: 'Neem Contact Op',
        subtitle: 'Heb je vragen of wil je meer weten over Salve Mundi? Neem gerust contact met ons op!',
        category: 'Contact'
    });
}

