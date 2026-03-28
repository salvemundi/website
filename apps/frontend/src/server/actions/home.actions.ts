'use server';

import {
    heroBannersSchema,
    activiteitenSchema,
    sponsorsSchema,
    type HeroBanner,
    type Activiteit,
    type Sponsor,
    HERO_BANNER_FIELDS,
    EVENT_FIELDS,
    PUB_CRAWL_EVENT_FIELDS,
    SPONSOR_FIELDS
} from '@salvemundi/validations';

import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';



export async function getHeroBanners(): Promise<HeroBanner[]> {
    try {
        const rawData = await getSystemDirectus().request(readItems('hero_banners', {
            fields: [...HERO_BANNER_FIELDS],
            limit: 10
        }));

        const mappedData = rawData.map((item: any) => ({
            id: item.id ?? '',
            title: item.title ?? '',
            subtitle: null,
            afbeelding_id: item.image ?? null,
            status: 'published',
            display_order: item.sort ?? 0,
        }));

        const parsed = heroBannersSchema.safeParse(mappedData);
        if (!parsed.success) {
            console.error('[home.actions#getHeroBanners] Zod validation failed');
            return [];
        }

        return parsed.data;
    } catch (err: unknown) {
        console.error('[home.actions#getHeroBanners] Error:', err);
        return [];
    }
}


export async function getUpcomingActiviteiten(limit = 4): Promise<Activiteit[]> {
    try {
        const client = getSystemDirectus();
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        const [regularEvents, pubCrawlEvents] = await Promise.all([
            client.request(readItems('events', {
                fields: [...EVENT_FIELDS],
                filter: {
                    status: { _eq: 'published' },
                    event_date: { _gte: today }
                },
                sort: ['event_date'],
                limit: limit
            })),
            client.request(readItems('pub_crawl_events', {
                fields: [...PUB_CRAWL_EVENT_FIELDS],
                filter: {
                    date: { _gte: today }
                },
                sort: ['date'],
                limit: limit
            }))
        ]);

        const mappedRegular = (regularEvents as any[]).map((item) => {
            let datum_start = now.toISOString();
            if (item.event_date) {
                const fullStr = item.event_time ? `${item.event_date}T${item.event_time}` : item.event_date;
                const parsed = new Date(fullStr);
                datum_start = isNaN(parsed.getTime()) ? new Date(item.event_date).toISOString() : parsed.toISOString();
            }

            return {
                id: String(item.id ?? ''),
                titel: item.name ?? '',
                beschrijving: item.description ?? null,
                locatie: item.location ?? null,
                datum_start,
                datum_eind: item.event_date_end ? new Date(item.event_date_end).toISOString() : null,
                afbeelding_id: item.image ?? null,
                status: item.status ?? undefined,
                price_members: item.price_members != null ? Number(item.price_members) : 0,
                price_non_members: item.price_non_members != null ? Number(item.price_non_members) : 0,
                only_members: item.only_members ?? false,
                registration_deadline: item.registration_deadline ?? null,
                contact: item.contact ?? null,
                event_time: item.event_time ?? null,
                event_time_end: item.event_time_end ?? null,
            };
        });

        const mappedPubCrawl = (pubCrawlEvents as any[]).map((item) => ({
            id: `kroeg-${item.id}`,
            titel: item.name ?? '',
            beschrijving: item.description ?? null,
            locatie: 'Diverse locaties',
            datum_start: item.date ? new Date(item.date).toISOString() : now.toISOString(),
            datum_eind: null,
            afbeelding_id: item.image ?? null,
            status: 'published',
            price_members: 1,
            price_non_members: 1,
            only_members: false,
            registration_deadline: null,
            contact: item.email ?? null,
            event_time: null,
            event_time_end: null,
            custom_url: '/kroegentocht',
        }));

        const allEvents = [...mappedRegular, ...mappedPubCrawl]
            .sort((a, b) => new Date(a.datum_start).getTime() - new Date(b.datum_start).getTime())
            .slice(0, limit);

        const parsed = activiteitenSchema.safeParse(allEvents);
        return parsed.success ? (parsed.data as any) : [];
    } catch (err: unknown) {
        console.error('[home.actions#getUpcomingActiviteiten] Error:', err);
        return [];
    }
}


export async function getSponsors(): Promise<Sponsor[]> {
    try {
        const rawData = await getSystemDirectus().request(readItems('sponsors', {
            fields: [...SPONSOR_FIELDS],
            sort: ['sponsor_id'],
            limit: -1
        }));

        const parsed = sponsorsSchema.safeParse(rawData);
        return parsed.success ? parsed.data : [];
    } catch (err: unknown) {
        console.error('[home.actions#getSponsors] Error:', err);
        return [];
    }
}

