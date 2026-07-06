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
import { getActivitiesInternal } from "@/server/queries/activiteiten/admin-activiteiten.queries";
import { getUpcomingTrips } from "@/server/actions/events/reis/reis-public.actions";
import { getDisabledRoutes } from '@/lib/config/feature-flags';
import { safeConsoleError } from '@/server/utils/logger';

export const getHeroBanners = unstable_cache(async (): Promise<HeroBanner[]> => {
    const rawData = await db.query.hero_banners.findMany({
        limit: 10,
        orderBy: (banners, { asc }) => [asc(banners.sort)]
    });

    const mappedData = rawData.map((item) => ({
        ...item,
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
                category: (item.committee_name as string | null | undefined) || undefined,
            };
        });

    const mappedPubCrawl = disabledRoutes.includes('/kroegentocht')
        ? []
        : pubCrawlEvents.map((item) => ({
            id: `kroeg-${item.id}`,
            name: item.name || '',
            description: item.description ?? null,
            description_logged_in: null,
            max_sign_ups: null,
            one_sign_up_max: false,
            committee_id: null,
            created_at: new Date().toISOString(),
            updated_at: null,
            image: item.image ?? null,
            publish_date: null,
            short_description: null,
            location: 'Diverse locaties',
            event_date: item.date ? (toLocalISOString(item.date, true) ?? new Date().toISOString()) : new Date().toISOString(),
            event_date_end: null,
            afbeelding_id: item.image ?? null,
            status: 'published',
            price_members: '1.00',
            price_non_members: '1.00',
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
            name: item.name ?? '',
            description: item.description ?? null,
            description_logged_in: null,
            max_sign_ups: null,
            one_sign_up_max: false,
            committee_id: null,
            created_at: new Date().toISOString(),
            updated_at: null,
            image: item.image ?? null,
            publish_date: null,
            short_description: null,
            location: 'Studiereis',
            event_date: toLocalISOString(item.start_date, true) ?? toLocalISOString(now, true) ?? new Date().toISOString(),
            event_date_end: toLocalISOString(item.end_date, true),
            afbeelding_id: item.image ?? null,
            status: 'published',
            price_members: item.base_price ? String(item.base_price) : '0.00',
            price_non_members: item.base_price ? String(item.base_price) : '0.00',
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
        .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
        .filter(event => {
            const date = new Date(event.event_date);
            return date >= new Date(new Date().setHours(0, 0, 0, 0));
        })
        .slice(0, limit);

    const parsed = activitiesSchema.safeParse(allEvents);
    if (!parsed.success) {
        safeConsoleError('[home.actions.ts][getUpcomingActiviteiten] Validation failed', JSON.stringify(parsed.error.issues, null, 2));
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