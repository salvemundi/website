import { generateOGImage } from '@/shared/lib/og-utils';

export const runtime = 'edge';
export const alt = 'Clubs - Salve Mundi';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
    return generateOGImage({
        title: 'Clubs',
        description: 'Sluit je aan bij één van onze gezellige clubs en maak nieuwe vrienden!',
        category: 'Gezelligheid',
    });
}
