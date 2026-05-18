import { connection } from 'next/server';
import { getHeroBanners, getUpcomingActiviteiten } from '@/server/actions/public/home.actions';
import { getImageUrl } from '@/lib/utils/image-utils';
import { type Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { safeConsoleError } from '@/server/utils/logger';

export async function HomePreloads() {
    await connection();
    try {
        const [banners, activities] = await Promise.all([
            getHeroBanners(),
            getUpcomingActiviteiten(4)
        ]);

        const criticalImages = [
            ...(banners[0]?.afbeelding_id ? [getImageUrl(banners[0].afbeelding_id, { width: 1200, height: 800, fit: 'cover' })] : []),
            ...activities.slice(0, 2).map((a: Activiteit) => a.afbeelding_id ? getImageUrl(a.afbeelding_id, { width: 400, height: 300, fit: 'cover' }) : null)
        ].filter((src): src is string => typeof src === 'string' && src.trim() !== '');

        if (criticalImages.length === 0) return null;

        return (
            <>
                {criticalImages.map((src, idx) => (
                    <link key={`home-preload-img-${idx}`} rel="preload" as="image" href={src} />
                ))}
            </>
        );
    } catch (error) {
        safeConsoleError('[HomePreloads][HomePreloads] Fout bij het ophalen van preload data', error);
        return null;
    }
}