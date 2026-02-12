import { getStickersAction } from '@/shared/api/sticker-actions';
import StickersPageClient from './StickersPageClient';

export const metadata = {
    title: 'Stickers - Salve Mundi',
    description: 'Zie waar onze leden stickers hebben geplakt, of voeg je eigen locatie toe!',
};

export default async function StickersPage() {
    const initialStickers = await getStickersAction();
    return <StickersPageClient initialStickers={initialStickers} />;
}
