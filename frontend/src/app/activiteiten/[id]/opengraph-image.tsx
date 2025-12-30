import { generateEventOGImage } from '@/shared/lib/og-event-utils';

export const runtime = 'edge';
export const alt = 'Event Details - Salve Mundi';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
    const eventId = params.id;

    try {
        // Fetch event data
        const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://admin.salvemundi.nl';
        const apiKey = process.env.NEXT_PUBLIC_DIRECTUS_API_KEY || '';

        const eventResponse = await fetch(
            `${directusUrl}/items/events/${eventId}?fields=id,name,event_date,description,price_members,price_non_members,image,committee_id`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        if (!eventResponse.ok) {
            throw new Error('Failed to fetch event');
        }

        const eventData = await eventResponse.json();
        const event = eventData.data;

        if (!event) {
            throw new Error('Event not found');
        }

        // Fetch committee name if exists
        let committeeName = undefined;
        if (event.committee_id) {
            try {
                const committeeResponse = await fetch(
                    `${directusUrl}/items/committees/${event.committee_id}?fields=name`,
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                        }
                    }
                );
                if (committeeResponse.ok) {
                    const committeeData = await committeeResponse.json();
                    committeeName = committeeData.data?.name?.replace(/\s*\|\|\s*SALVE MUNDI\s*/gi, '').trim();
                }
            } catch (err) {
                console.error('Failed to fetch committee:', err);
            }
        }

        // Format price
        let priceText = undefined;
        if (event.price_members !== undefined && event.price_members !== null) {
            const memberPrice = Number(event.price_members);
            const nonMemberPrice = event.price_non_members ? Number(event.price_non_members) : memberPrice;

            if (memberPrice === 0 && nonMemberPrice === 0) {
                priceText = 'Gratis';
            } else if (memberPrice === nonMemberPrice) {
                priceText = `€${memberPrice.toFixed(2)}`;
            } else {
                priceText = `€${memberPrice.toFixed(2)} (leden) / €${nonMemberPrice.toFixed(2)}`;
            }
        }

        // Get image URL
        let imageUrl = undefined;
        if (event.image) {
            const imageId = typeof event.image === 'object' ? event.image.id : event.image;
            imageUrl = `${directusUrl}/assets/${imageId}?access_token=${apiKey}&width=1200&height=630&fit=cover`;
        }

        return generateEventOGImage({
            title: event.name,
            date: event.event_date,
            price: priceText,
            imageUrl: imageUrl,
            committeeName: committeeName,
        });
    } catch (error) {
        console.error('Error generating event OG image:', error);

        // Fallback - import fallback generator
        const { generateOGImage } = await import('@/shared/lib/og-utils');
        return generateOGImage({
            title: 'Activiteit',
            description: 'Bekijk deze activiteit van Salve Mundi',
            category: 'Event',
        });
    }
}
