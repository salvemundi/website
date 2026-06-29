// OG-image route voor de reispagina
import { generateEventOGImage } from '@/lib/utils/og-utils';
import { getUpcomingTrips } from '@/server/actions/events/trip.actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    const trips = await getUpcomingTrips();
    const nextTrip = trips.length > 0 ? trips[0] : null;

    const title = nextTrip?.name || 'Reizen';
    const startDate = nextTrip?.start_date ? new Date(nextTrip.start_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
    const endDate = nextTrip?.end_date ? new Date(nextTrip.end_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

    const dateRange = startDate && endDate ? `${startDate} – ${endDate}` : (startDate || 'Binnenkort meer info');

    return generateEventOGImage({
        title: title,
        dateStr: dateRange
    });
}

