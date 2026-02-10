import { generateOGImage } from '@/shared/lib/og-utils';

export const runtime = 'edge';
export const alt = 'Salve Mundi - Studievereniging Fontys ICT Eindhoven';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
    return generateOGImage({
        title: 'Salve Mundi',
        description: 'De studievereniging voor HBO-studenten in Eindhoven. Meer dan alleen studeren.',
        category: 'Studievereniging',
    });
}
