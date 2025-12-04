import { generateOGImage } from '@/shared/lib/og-utils';

export const runtime = 'edge';
export const alt = 'Stickers - Salve Mundi';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
    return generateOGImage({
        title: 'Stickers Map',
        description: 'Ontdek waar alle Salve Mundi stickers zijn geplakt door onze leden!',
        category: 'Community',
    });
}
