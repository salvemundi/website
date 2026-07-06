// OG-image route voor de kroegentochtpagina
import { generateEventOGImage } from '@/lib/utils/og-utils';
import { getKroegentochtEvent } from '@/server/actions/events/kroegentocht/kroegentocht-public.actions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    const event = await getKroegentochtEvent();

    const title = event?.name || 'Kroegentocht';
    const date = event?.date ? new Date(event.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Binnenkort meer info';

    return generateEventOGImage({
        title: title,
        dateStr: date
    });
}

