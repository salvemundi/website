import { generateOGImage } from '@/shared/lib/og-utils';

export const runtime = 'edge';
export const alt = 'WhatsApp Groepen - Salve Mundi';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
    return generateOGImage({
        title: 'WhatsApp Groepen',
        description: 'Blijf op de hoogte en verbind met medestudenten via onze WhatsApp groepen.',
        category: 'Community',
    });
}
