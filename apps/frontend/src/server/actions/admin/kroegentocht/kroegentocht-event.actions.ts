'use server';

import 'server-only';
import { revalidateTag, revalidatePath } from 'next/cache';
import {
    pubCrawlEventSchema,
    type PubCrawlEvent
} from '@salvemundi/validations/schema/pub-crawl.zod';
import { getSystemDirectus } from "@/lib/directus";
import {
    updateItem,
    createItem,
    uploadFiles
} from '@directus/sdk';
import { fetchPubCrawlEventsDb } from '@/server/internal/kroegentocht-db.utils';
import { requireAdminResource } from '@/server/auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';
import { safeConsoleError } from '@/server/utils/logger';

export async function requireKroegAdmin() {
    return requireAdminResource(AdminResource.Kroegentocht);
}

export async function getPubCrawlEvents(): Promise<PubCrawlEvent[]> {
    await requireKroegAdmin();
    try {
        return await fetchPubCrawlEventsDb();
    } catch (error) {
        safeConsoleError(`[Kroegentocht-Action][getPubCrawlEvents] Failed to fetch events:`, error);
        throw new Error('Kon events niet ophalen');
    }
}

export async function getPubCrawlEvent(id: string | number): Promise<PubCrawlEvent> {
    await requireKroegAdmin();
    try {
        const { fetchPubCrawlEventByIdDb } = await import('@/server/internal/kroegentocht-db.utils');
        const event = await fetchPubCrawlEventByIdDb(Number(id));
        if (!event) throw new Error('Event niet gevonden');
        return pubCrawlEventSchema.parse(event);
    } catch (error) {
        safeConsoleError(`[Kroegentocht-Action][getPubCrawlEvent] Failed to fetch event ${id}:`, error);
        throw new Error('Kon event niet ophalen');
    }
}

export async function upsertPubCrawlEvent(data: Partial<PubCrawlEvent>) {
    await requireKroegAdmin();
    const { id, name, description, date, email, image, whatsapp_community_url } = data;

    const payload = { name, description, date, email, image, whatsapp_community_url };

    try {
        const client = getSystemDirectus();
        let eventId = id;
        if (id) {
            await client.request(updateItem('pub_crawl_events', id, payload));
        } else {
            const created = await client.request(createItem('pub_crawl_events', payload)) as unknown as { id: number };
            eventId = created.id;
        }

        // Save groups directly in PostgreSQL and update signup group names on rename/delete
        if (eventId && data.groups !== undefined) {
            const { query } = await import('@/lib/database');
            
            // 1. Fetch old groups if updating
            let oldGroups: { name: string; leaders?: unknown[] }[] = [];
            if (id) {
                const res = await query<{ groups: unknown }>(
                    'SELECT groups FROM pub_crawl_events WHERE id = $1',
                    [Number(id)]
                );
                if (res.rows.length > 0 && res.rows[0].groups) {
                    const rawGroups = res.rows[0].groups;
                    if (Array.isArray(rawGroups)) {
                        oldGroups = rawGroups.map(g => {
                            const obj = g && typeof g === 'object' ? (g as { name?: unknown; leaders?: unknown }) : {};
                            return {
                                name: typeof obj.name === 'string' ? obj.name : '',
                                leaders: Array.isArray(obj.leaders) ? obj.leaders : []
                            };
                        });
                    }
                }
            }

            // 2. Perform groups list update
            await query(
                'UPDATE pub_crawl_events SET groups = $1 WHERE id = $2',
                [JSON.stringify(data.groups), Number(eventId)]
            );

            // 3. Handle cascade updates for signups if there are old groups
            if (id && oldGroups.length > 0 && Array.isArray(data.groups)) {
                const newGroups = data.groups as { name: string }[];
                const oldNames = oldGroups.map(g => g.name);
                const newNames = newGroups.map(g => g.name);

                const removedNames = oldNames.filter(name => !newNames.includes(name));
                const addedNames = newNames.filter(name => !oldNames.includes(name));

                const renames = new Map<string, string>(); // oldName -> newName

                if (removedNames.length > 0 && addedNames.length > 0) {
                    // For each new group, check if its index matches an old group
                    // and if the old name was removed and the new name was added
                    for (let i = 0; i < Math.min(oldGroups.length, newGroups.length); i++) {
                        const oldName = oldGroups[i]?.name;
                        const newName = newGroups[i]?.name;
                        if (
                            oldName && 
                            newName && 
                            oldName !== newName && 
                            removedNames.includes(oldName) && 
                            addedNames.includes(newName)
                        ) {
                            renames.set(oldName, newName);
                        }
                    }
                }

                // Update signups for renamed groups
                for (const [oldName, newName] of renames.entries()) {
                    await query(
                        `UPDATE pub_crawl_signups 
                         SET group_name = $1 
                         WHERE pub_crawl_event_id = $2 AND group_name = $3`,
                        [newName, Number(eventId), oldName]
                    );
                }

                // Clear group_name for completely deleted groups
                const completelyRemoved = removedNames.filter(name => !renames.has(name));
                if (completelyRemoved.length > 0) {
                    await query(
                        `UPDATE pub_crawl_signups 
                         SET group_name = NULL 
                         WHERE pub_crawl_event_id = $1 AND group_name = ANY($2)`,
                        [Number(eventId), completelyRemoved]
                    );
                }
            }
        }

        revalidateTag('kroegentocht-events', 'max');
        revalidateTag('kroegentocht-event', 'max');
        revalidatePath('/beheer/kroegentocht');

        return { success: true };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Onbekende fout';
        safeConsoleError(`[Kroegentocht-Action][upsertPubCrawlEvent] Failed to upsert event:`, e);
        throw new Error('Opslaan van event mislukt: ' + message);
    }
}

export async function uploadPubCrawlImage(formData: FormData) {
    await requireKroegAdmin();
    try {
        const client = getSystemDirectus();
        const response = await client.request(uploadFiles(formData));
        return response;
    } catch (error) {
        safeConsoleError(`[Kroegentocht-Action][uploadPubCrawlImage] Failed to upload image:`, error);
        throw new Error('Afbeelding uploaden mislukt');
    }
}

export async function updatePubCrawlEventGroups(eventId: number, groups: unknown[]) {
    await requireKroegAdmin();
    try {
        const { query } = await import('@/lib/database');
        await query(
            'UPDATE pub_crawl_events SET groups = $1 WHERE id = $2',
            [JSON.stringify(groups), eventId]
        );
        revalidateTag('kroegentocht-events', 'max');
        revalidateTag('kroegentocht-event', 'max');
        revalidatePath('/beheer/kroegentocht');
        return { success: true };
    } catch (error) {
        safeConsoleError('[Kroegentocht-Action][updatePubCrawlEventGroups] Error:', error);
        throw new Error('Bijwerken groepsindeling mislukt');
    }
}
