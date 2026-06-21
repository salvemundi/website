// OG-image route voor de homepage
import { generateGradientOGImage } from '@/lib/utils/og-utils';

export const alt = 'Salve Mundi - Studievereniging ICT';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    return generateGradientOGImage({
        title: 'Salve Mundi Eindhoven',
        subtitle: 'De gezelligste community van Fontys ICT. Ontdek activiteiten, commissies en word lid!',
        category: 'Studievereniging ICT'
    });
}

