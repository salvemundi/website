'use server';

import 'server-only';
import { revalidateTag, revalidatePath } from 'next/cache';
import {
    pubCrawlEventSchema,
    type PubCrawlEvent
} from '@salvemundi/validations/schema/pub-crawl.zod';
import { db, schema } from '@salvemundi/db';
import { eq, and, inArray } from 'drizzle-orm';
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
        safeConsoleError(`[kroegentocht-event.actions.ts][getPubCrawlEvents] Failed to fetch events:`, error);
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
        safeConsoleError(`[kroegentocht-event.actions.ts][getPubCrawlEvent] Failed to fetch event ${id}:`, error);
        throw new Error('Kon event niet ophalen');
    }
}

export async function upsertPubCrawlEvent(data: Partial<PubCrawlEvent>) {
    await requireKroegAdmin();
    const { id, name, description, date, email, image, whatsapp_community_url } = data;

    try {
        let eventId = id;
        if (id) {
            const updatePayload = {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description: description || null }),
                ...(date !== undefined && { date: date || null }),
                ...(typeof email === 'string' && { email }),
                ...(image !== undefined && { image: image || null }),
                ...(whatsapp_community_url !== undefined && { whatsapp_community_url: whatsapp_community_url || null })
            };
            const updated = await db.update(schema.pub_crawl_events).set(updatePayload).where(eq(schema.pub_crawl_events.id, Number(id))).returning();
            if (updated.length > 0) eventId = updated[0].id;
        } else {
            if (!name || !email) throw new Error('Name and email are required for new events');
            const insertPayload = {
                name,
                email,
                description: description || null,
                date: date || null,
                image: image || null,
                whatsapp_community_url: whatsapp_community_url || null
            };
            const created = await db.insert(schema.pub_crawl_events).values(insertPayload).returning();
            if (created.length > 0) eventId = created[0].id;
        }

        // Save groups directly in PostgreSQL and update signup group names on rename/delete
        if (eventId && data.groups !== undefined) {
            // 1. Fetch old groups if updating
            let oldGroups: { name: string; leaders?: unknown[] }[] = [];
            if (id) {
                const oldEvent = await db.query.pub_crawl_events.findFirst({
                    columns: { groups: true },
                    where: eq(schema.pub_crawl_events.id, Number(id))
                });
                
                if (oldEvent && oldEvent.groups) {
                    const rawGroups = oldEvent.groups;
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
            await db.update(schema.pub_crawl_events)
                .set({ groups: data.groups })
                .where(eq(schema.pub_crawl_events.id, Number(eventId)));

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
                    await db.update(schema.pub_crawl_signups)
                        .set({ group_name: newName })
                        .where(
                            and(
                                eq(schema.pub_crawl_signups.pub_crawl_event_id, Number(eventId)),
                                eq(schema.pub_crawl_signups.group_name, oldName)
                            )
                        );
                }

                // Clear group_name for completely deleted groups
                const completelyRemoved = removedNames.filter(name => !renames.has(name));
                if (completelyRemoved.length > 0) {
                    await db.update(schema.pub_crawl_signups)
                        .set({ group_name: null })
                        .where(
                            and(
                                eq(schema.pub_crawl_signups.pub_crawl_event_id, Number(eventId)),
                                inArray(schema.pub_crawl_signups.group_name, completelyRemoved)
                            )
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
        safeConsoleError(`[kroegentocht-event.actions.ts][upsertPubCrawlEvent] Failed to upsert event:`, e);
        throw new Error('Opslaan van event mislukt: ' + message);
    }
}

export async function uploadPubCrawlImage(formData: FormData) {
    await requireKroegAdmin();
    try {
        const token = process.env.DIRECTUS_STATIC_TOKEN;
        const directusUrl = process.env.INTERNAL_DIRECTUS_URL;
        const res = await fetch(`${directusUrl}/files`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        if (!res.ok) {
            throw new Error(`Upload failed: ${await res.text()}`);
        }

        const json = await res.json() as unknown;
        return json;
    } catch (error) {
        safeConsoleError(`[kroegentocht-event.actions.ts][uploadPubCrawlImage] Failed to upload image:`, error);
        throw new Error('Afbeelding uploaden mislukt');
    }
}

export async function updatePubCrawlEventGroups(eventId: number, groups: unknown[]) {
    await requireKroegAdmin();
    try {
        await db.update(schema.pub_crawl_events).set({ groups: groups }).where(eq(schema.pub_crawl_events.id, eventId));
        revalidateTag('kroegentocht-events', 'max');
        revalidateTag('kroegentocht-event', 'max');
        revalidatePath('/beheer/kroegentocht');
        return { success: true };
    } catch (error) {
        safeConsoleError('[kroegentocht-event.actions.ts][updatePubCrawlEventGroups] Error:', error);
        throw new Error('Bijwerken groepsindeling mislukt');
    }
}
