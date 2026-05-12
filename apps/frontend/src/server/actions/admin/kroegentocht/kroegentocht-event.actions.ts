'use server';

import 'server-only';
import { revalidateTag, revalidatePath } from 'next/cache';
import {
    pubCrawlEventSchema,
    type PubCrawlEvent
} from '@salvemundi/validations/schema/pub-crawl.zod';
import {
    PUB_CRAWL_EVENT_FIELDS
} from '@salvemundi/validations/directus/fields';
import { getSystemDirectus } from "@/lib/directus";
import {
    readItem,
    updateItem,
    createItem,
    uploadFiles
} from '@directus/sdk';
import { fetchPubCrawlEventsDb } from '@/server/internal/kroegentocht-db.utils';
import { requireAdminResource } from '@/server/auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';

export async function requireKroegAdmin() {
    return requireAdminResource(AdminResource.Kroegentocht);
}

export async function getPubCrawlEvents(): Promise<PubCrawlEvent[]> {
    await requireKroegAdmin();
    try {
        return await fetchPubCrawlEventsDb();
    } catch (_error) {
        throw new Error('Kon events niet ophalen');
    }
}

export async function getPubCrawlEvent(id: string | number): Promise<PubCrawlEvent> {
    await requireKroegAdmin();
    try {
        const item = await getSystemDirectus().request(readItem('pub_crawl_events', id, {
            fields: [...PUB_CRAWL_EVENT_FIELDS]
        }));
        const event = item as unknown as PubCrawlEvent;
        return pubCrawlEventSchema.parse(event);
    } catch (_error) {
        throw new Error('Kon event niet ophalen');
    }
}

export async function upsertPubCrawlEvent(data: Partial<PubCrawlEvent>) {
    await requireKroegAdmin();
    const { id, name, description, date, email, image } = data;

    const payload = { name, description, date, email, image };

    try {
        const client = getSystemDirectus();
        if (id) {
            await client.request(updateItem('pub_crawl_events', id, payload));
        } else {
            await client.request(createItem('pub_crawl_events', payload));
        }

        revalidateTag('kroegentocht-events', 'max');
        revalidateTag('kroegentocht-event', 'max');
        revalidatePath('/beheer/kroegentocht');

        return { success: true };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Onbekende fout';
        console.error('[Kroegentocht-Action] Upsert failed:', message);
        throw new Error('Opslaan van event mislukt: ' + message);
    }
}

export async function uploadPubCrawlImage(formData: FormData) {
    await requireKroegAdmin();
    try {
        const client = getSystemDirectus();
        const response = await client.request(uploadFiles(formData));
        return response;
    } catch (_error) {
        throw new Error('Afbeelding uploaden mislukt');
    }
}
