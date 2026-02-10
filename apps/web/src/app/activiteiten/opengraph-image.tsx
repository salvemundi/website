import { generateOGImage } from '@/shared/lib/og-utils';

export const runtime = 'edge';
export const alt = 'Activiteiten - Salve Mundi';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
    return generateOGImage({
        title: 'Activiteiten',
        description: 'Ontdek alle activiteiten van borrels tot bedrijfsbezoeken. Er is altijd iets te doen!',
        category: 'Events',
    });
}
