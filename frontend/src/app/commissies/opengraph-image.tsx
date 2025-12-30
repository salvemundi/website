import { generateOGImage } from '@/shared/lib/og-utils';

export const runtime = 'edge';
export const alt = 'Commissies - Salve Mundi';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
    return generateOGImage({
        title: 'Commissies',
        description: 'Boost je CV door actief te worden in een van onze 15 commissies.',
        category: 'Ontwikkeling',
    });
}
