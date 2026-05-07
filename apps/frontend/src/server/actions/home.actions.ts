'use server';

import {
    heroBannersSchema,
    sponsorsSchema,
    type HeroBanner,
    type Sponsor
} from '@salvemundi/validations';
import {
    activitiesSchema,
    type Activiteit
} from '@salvemundi/validations';
import { 
    HERO_BANNER_FIELDS, 
    EVENT_FIELDS, 
    PUB_CRAWL_EVENT_FIELDS, 
    SPONSOR_FIELDS 
} from '@salvemundi/validations';

import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { 
    type DbPubCrawlEvent,
    type DbTrip,
    type DbHeroBanner,
    type DbSponsor 
} from '@salvemundi/validations';
import { cacheLife } from 'next/cache';

export const getHeroBanners = async (): Promise<HeroBanner[]> => {
    'use cache';
    cacheLife('minutes');
    const rawData = await getSystemDirectus().request(readItems('hero_banners', {
        fields: [...HERO_BANNER_FIELDS],
        limit: 10
    }));

    const mappedData = rawData.map((item: DbHeroBanner) => ({
        id: item.id ?? '',
        title: item.title ?? '',
        subtitle: null,
        afbeelding_id: item.image ?? null,
        status: 'published',
        display_order: item.sort ?? 0,
    }));

    const parsed = heroBannersSchema.safeParse(mappedData);
    if (!parsed.success) {
        console.error('[Validation Error] getHeroBanners:', parsed.error);
        return mappedData as HeroBanner[];
    }

    return parsed.data;
}


import { 
    getActivitiesInternal 
} from "@/server/queries/admin-event.queries";
import { 
    getUpcomingTrips 
} from "@/server/actions/reis.actions";
import { connection } from "next/server";

export const getUpcomingActiviteiten = async (limit = 4): Promise<Activiteit[]> => {
    'use cache';
    cacheLife('minutes');
    const client = getSystemDirectus();
    const now = new Date();
    const today = toLocalISOString(now) as string;
    
    const [regularEvents, pubCrawlEvents, tripEvents] = await Promise.all([
        getActivitiesInternal(true),
        client.request(readItems('pub_crawl_events', {
            fields: [...PUB_CRAWL_EVENT_FIELDS],
            filter: {
                date: { _gte: today }
            },
            sort: ['date'],
            limit: limit
        })),
        getUpcomingTrips()
    ]);

    const mappedRegular = (regularEvents as Activiteit[]).map((item) => {
        return {
            ...item,
            category: item.committee_name || undefined, // Let component fallback if this is null
        };
    });

    const mappedPubCrawl = (pubCrawlEvents as DbPubCrawlEvent[]).map((item) => ({
        id: `kroeg-${item.id}`,
        titel: item.name ?? '',
        beschrijving: item.description ?? null,
        locatie: 'Diverse locaties',
        datum_start: toLocalISOString(item.date, true) || toLocalISOString(now, true)!,
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
        category: 'Feestcommissie',
        committee_name: 'Feestcommissie',
    }));

    const mappedTrips = (tripEvents as DbTrip[]).map((item) => ({
        id: `trip-${item.id}`,
        titel: item.name ?? '',
        beschrijving: item.description ?? null,
        locatie: 'Studiereis',
        datum_start: toLocalISOString(item.start_date, true) || toLocalISOString(now, true)!,
        datum_eind: toLocalISOString(item.end_date, true),
        afbeelding_id: item.image ?? null,
        status: 'published',
        price_members: item.base_price ?? 0,
        price_non_members: item.base_price ?? 0,
        only_members: true,
        registration_deadline: item.registration_start_date ?? null,
        contact: 'Reiscommissie',
        event_time: null,
        event_time_end: null,
        custom_url: '/reis',
        category: 'Reiscommissie',
        committee_name: 'Reiscommissie',
    }));

    const allEvents = [...mappedRegular, ...mappedPubCrawl, ...mappedTrips]
        .sort((a, b) => new Date(a.datum_start).getTime() - new Date(b.datum_start).getTime())
        .filter(event => {
            const date = new Date(event.datum_start);
            // Include today's events and future ones
            return date >= new Date(new Date().setHours(0, 0, 0, 0));
        })
        .slice(0, limit);

    const parsed = activitiesSchema.safeParse(allEvents);
    if (!parsed.success) {
        console.error('[Validation Error] getUpcomingActiviteiten:', parsed.error);
        return allEvents as unknown as Activiteit[];
    }

    return parsed.data;
}


export const getSponsors = async (): Promise<Sponsor[]> => {
    'use cache';
    cacheLife('hours');
    const rawData = await getSystemDirectus().request(readItems('sponsors', {
        fields: [...SPONSOR_FIELDS],
        sort: ['sponsor_id'],
        limit: -1
    }));

    const parsed = sponsorsSchema.safeParse(rawData);
    if (!parsed.success) {
        console.error('[Validation Error] getSponsors:', parsed.error);
        return rawData as unknown as Sponsor[];
    }

    return parsed.data;
}

