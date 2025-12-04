import { generateOGImage } from '@/shared/lib/og-utils';

export const runtime = 'edge';
export const alt = 'Lidmaatschap - Salve Mundi';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
    return generateOGImage({
        title: 'Word Lid',
        description: 'Voor slechts €15 per jaar krijg je toegang tot alle activiteiten met korting!',
        category: 'Membership',
    });
}
