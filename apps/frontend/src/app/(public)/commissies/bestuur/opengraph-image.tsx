// OG-image route voor de Bestuur pagina
import { generateGradientOGImage } from '@/lib/utils/og-utils';

export const alt = 'Bestuur - Salve Mundi';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    return generateGradientOGImage({
        title: 'Het Bestuur van Salve Mundi',
        subtitle: 'Maak kennis met de mensen die de vereniging draaiende houden en het beleid bepalen.',
        category: 'Bestuur'
    });
}

