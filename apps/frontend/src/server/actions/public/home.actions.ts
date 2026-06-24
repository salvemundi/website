import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from '@salvemundi/db';

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

import { toLocalISOString } from '@/lib/utils/date-utils';
import {
    type Schema
} from '@salvemundi/validations';
import { getActivitiesInternal } from "@/server/queries/admin-event.queries";
import { getUpcomingTrips } from "@/server/actions/events/reis.actions";
import { getDisabledRoutes } from '@/lib/config/feature-flags';

export const getHeroBanners = unstable_cache(async (): Promise<HeroBanner[]> => {
    const rawData = await db.query.hero_banners.findMany({
        limit: 10,
        orderBy: (banners, { asc }) => [asc(banners.sort)]
    });

    const mappedData = rawData.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: null,
        afbeelding_id: item.image ?? null,
        status: 'published',
        display_order: item.sort ?? 0
    }));

    const parsed = heroBannersSchema.safeParse(mappedData);
    if (!parsed.success) {
        throw new Error(`[home.actions.ts][getHeroBanners] Validation failed: ${parsed.error.message}`);
    }

    return parsed.data;
}, ['hero_banners_cache'], { tags: ['hero_banners'], revalidate: 3600 });

export const getUpcomingActiviteiten = unstable_cache(async (limit: number = 4): Promise<Activiteit[]> => {
    const now = new Date();
    const today = toLocalISOString(now) ?? new Date().toISOString();

    const [regularEvents, pubCrawlEvents, tripEvents, disabledRoutes] = await Promise.all([
        getActivitiesInternal(true),
        db.query.pub_crawl_events.findMany({
            where: (events, { gte }) => gte(events.date, today),
            orderBy: (events, { asc }) => [asc(events.date)],
            limit: limit
        }),
        getUpcomingTrips(),
        getDisabledRoutes()
    ]);

    const mappedRegular = (regularEvents as Activiteit[])
        .filter(event => !event.custom_url || !disabledRoutes.includes(event.custom_url))
        .map((item) => {
            return {
                ...item,
                category: item.committee_name || undefined,
            };
        });

    const mappedPubCrawl = disabledRoutes.includes('/kroegentocht')
        ? []
        : pubCrawlEvents.map((item) => ({
            id: `kroeg-${item.id}`,
            titel: item.name || '',
            beschrijving: item.description ?? null,
            locatie: 'Diverse locaties',
            datum_start: item.date ? (toLocalISOString(item.date, true) ?? new Date().toISOString()) : new Date().toISOString(),
            datum_eind: null,
            afbeelding_id: item.image ?? null,
            status: 'published',
            price_members: 1,
            price_non_members: 1,
            only_members: false,
            registration_deadline: null,
            contact: item.email,
            event_time: null,
            event_time_end: null,
            custom_url: '/kroegentocht',
            category: 'Feestcommissie',
            committee_name: 'Feestcommissie'
        }));

    const mappedTrips = disabledRoutes.includes('/reis')
        ? []
        : (tripEvents as unknown as Schema['trips']).map((item) => ({
            id: `trip-${item.id}`,
            titel: item.name ?? '',
            beschrijving: item.description ?? null,
            locatie: 'Studiereis',
            datum_start: toLocalISOString(item.start_date, true) ?? toLocalISOString(now, true) ?? new Date().toISOString(),
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
            committee_name: 'Reiscommissie'
        }));

    const allEvents = [...mappedRegular, ...mappedPubCrawl, ...mappedTrips]
        .sort((a, b) => new Date(a.datum_start).getTime() - new Date(b.datum_start).getTime())
        .filter(event => {
            const date = new Date(event.datum_start);
            return date >= new Date(new Date().setHours(0, 0, 0, 0));
        })
        .slice(0, limit);

    const parsed = activitiesSchema.safeParse(allEvents);
    if (!parsed.success) {
        throw new Error(`[home.actions.ts][getUpcomingActiviteiten] Validation failed: ${parsed.error.message}`);
    }

    return parsed.data;
}, ['upcoming_activities_cache'], { tags: ['events', 'pub_crawl_events', 'trips'], revalidate: 3600 });

export const getSponsors = unstable_cache(async (): Promise<Sponsor[]> => {
    const rawData = await db.query.sponsors.findMany({
        orderBy: (sponsors, { asc }) => [asc(sponsors.sponsor_id)]
    });

    const parsed = sponsorsSchema.safeParse(rawData);
    if (!parsed.success) {
        throw new Error(`[home.actions.ts][getSponsors] Validation failed: ${parsed.error.message}`);
    }

    return parsed.data;
}, ['sponsors_cache'], { tags: ['sponsors'], revalidate: 3600 });