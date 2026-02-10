import { generateOGImage } from '@/shared/lib/og-utils';

export const runtime = 'edge';
export const alt = 'Safe Havens - Salve Mundi';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
    return generateOGImage({
        title: 'Safe Havens',
        description: 'Ontdek veilige plekken en hulpbronnen voor studenten.',
        category: 'Support',
    });
}
