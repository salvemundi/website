// OG-image route voor de introductiepagina
import { generateEventOGImage } from '@/lib/utils/og-utils';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    const title = 'De Salve Mundi Intro';
    const date = '24 augustus 2026 – 28 augustus 2026';

    return generateEventOGImage({
        title: title,
        dateStr: date
    });
}

