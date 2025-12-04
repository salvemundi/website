import { generateOGImage } from '@/shared/lib/og-utils';

export const runtime = 'edge';
export const alt = 'Contact - Salve Mundi';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
    return generateOGImage({
        title: 'Neem Contact Op',
        description: 'Heb je vragen of wil je meer weten over Salve Mundi? Neem gerust contact met ons op!',
        category: 'Contact',
    });
}
