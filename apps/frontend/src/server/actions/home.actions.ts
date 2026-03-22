'use server';

import {
    heroBannersSchema,
    activiteitenSchema,
    sponsorsSchema,
    type HeroBanner,
    type Activiteit,
    type Sponsor,
} from '@salvemundi/validations';

import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';

// Removed redundant fetchWithTimeout in favor of Directus SDK.

// ─── Hero Banners ─────────────────────────────────────────────────────────────

export async function getHeroBanners(): Promise<HeroBanner[]> {
    try {
        const rawData = await getSystemDirectus().request(readItems('hero_banners', {
            fields: ['id', 'title', 'image', 'sort'],
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
            console.error('[home.actions#getHeroBanners] Zod validatie mislukt');
            return [];
        }

        return parsed.data;
    } catch (err: unknown) {
        console.error('[home.actions#getHeroBanners] Error:', err);
        return [];
    }
}

// ─── Activiteiten ─────────────────────────────────────────────────────────────

export async function getUpcomingActiviteiten(limit = 4): Promise<Activiteit[]> {
    try {
        const rawData = await getSystemDirectus().request(readItems('events', {
            fields: ['id', 'name', 'description', 'location', 'event_date', 'event_date_end', 'image', 'status', 'price_members', 'price_non_members', 'only_members', 'inschrijf_deadline', 'contact', 'event_time', 'event_time_end'],
            filter: {
                status: { _eq: 'published' },
                event_date: { _gte: '$NOW' }
            },
            sort: ['event_date'],
            limit: limit
        }));

        const mappedData = rawData.map((item: any) => ({
            id: String(item.id ?? ''),
            titel: item.name ?? '',
            beschrijving: item.description ?? null,
            locatie: item.location ?? null,
            datum_start: item.event_date ? new Date(item.event_date).toISOString() : new Date().toISOString(),
            datum_eind: item.event_date_end ? new Date(item.event_date_end).toISOString() : null,
            afbeelding_id: item.image ?? null,
            status: item.status ?? undefined,
            price_members: item.price_members != null ? Number(item.price_members) : 0,
            price_non_members: item.price_non_members != null ? Number(item.price_non_members) : 0,
            only_members: item.only_members ?? false,
            inschrijf_deadline: item.inschrijf_deadline ?? null,
            contact: item.contact ?? null,
            event_time: item.event_time ?? null,
            event_time_end: item.event_time_end ?? null,
        }));

        const parsed = activiteitenSchema.safeParse(mappedData);
        return parsed.success ? parsed.data : [];
    } catch (err: unknown) {
        console.error('[home.actions#getUpcomingActiviteiten] Error:', err);
        return [];
    }
}

// ─── Sponsors ─────────────────────────────────────────────────────────────────

export async function getSponsors(): Promise<Sponsor[]> {
    try {
        const rawData = await getSystemDirectus().request(readItems('sponsors', {
            fields: ['sponsor_id', 'image', 'website_url', 'dark_bg'],
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

