'use server';

import { getEnrichedSession } from '@/server/auth/auth-utils';
import { revalidateTag, revalidatePath } from "next/cache";

import { stickerPublicSchema } from "@salvemundi/validations";

import { db, schema } from '@salvemundi/db';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { safeConsoleError } from '@/server/utils/logger';

const stickerListSchema = z.array(stickerPublicSchema);

const stickerCreateSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
    location_name: z.string(),
    description: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
});

export async function getPublicStickers() {
    const session = await getEnrichedSession();
    const isLoggedIn = !!session?.user;

    const rows = await db.select({
        s: schema.Stickers,
        u: {
            id: schema.directus_users.id,
            first_name: schema.directus_users.first_name,
            last_name: schema.directus_users.last_name,
            avatar: schema.directus_users.avatar
        }
    })
    .from(schema.Stickers)
    .leftJoin(schema.directus_users, eq(schema.Stickers.user_created, schema.directus_users.id))
    .where(eq(schema.Stickers.status, 'published'))
    .orderBy(desc(schema.Stickers.date_created));

    const mapped = rows.map((row) => ({
        id: Number(row.s.id),
        latitude: Number(row.s.latitude),
        longitude: Number(row.s.longitude),
        location_name: row.s.location_name || '',
        description: row.s.description || '',
        city: row.s.city || '',
        country: row.s.country || '',
        image: row.s.image || null,
        date_created: row.s.date_created ? String(row.s.date_created) : '',
        user_created: (isLoggedIn && row.u && row.u.id) ? {
            id: row.u.id,
            first_name: row.u.first_name,
            last_name: row.u.last_name,
            avatar: row.u.avatar
        } : null
    }));

    return stickerListSchema.parse(mapped);
}

export async function createStickerPublic(data: unknown) {
    const session = await getEnrichedSession();

    if (!session?.user) {
        throw new Error('Je moet ingelogd zijn om een sticker toe te voegen.');
    }

    const { rateLimit } = await import('@/server/utils/ratelimit');
    const { success: rateLimitSuccess } = await rateLimit('sticker-create', 5, 300);
    if (!rateLimitSuccess) {
        throw new Error('Te veel stickers geplaatst. Probeer het later opnieuw.');
    }

    const parsed = stickerCreateSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: 'Ongeldige stickergegevens.' };
    }

    const payload = {
        ...parsed.data,
        status: 'published',
        user_created: session.user.id
    };

    try {
        const inserted = await db.insert(schema.Stickers).values(payload).returning();
        
        revalidatePath('/beheer/stickers');
        revalidatePath('/stickers');
        revalidateTag('stickers', 'max');
        return { success: true, data: inserted[0] };
    } catch (error) {
        safeConsoleError(`[stickers.actions.ts][createStickerPublic] Error while creating sticker:`, error);
        return { success: false, error: 'Kon sticker niet opslaan.' };
    }
}

export async function uploadFileAction(formData: FormData): Promise<{ success: true; data: string } | { success: false; error: string }> {
    const session = await getEnrichedSession();
    if (!session?.user) {
        throw new Error('Niet geautoriseerd: Je moet ingelogd zijn om bestanden te uploaden.');
    }

    const { rateLimit } = await import('@/server/utils/ratelimit');
    const { success } = await rateLimit('file-upload', 5, 300);
    if (!success) {
        throw new Error('Te veel bestanden geüpload. Probeer het later opnieuw.');
    }
    try {
        const token = (process.env.INTERNAL_SERVICE_TOKEN || '').replace(/^"|"$/g, '').trim();
        const res = await fetch(`${process.env.DIRECTUS_URL}/files`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        if (!res.ok) {
            throw new Error(`Upload failed: ${await res.text()}`);
        }

        const json = await res.json() as { data?: { id?: string } };
        const fileId = json.data?.id;

        if (!fileId) {
            return { success: false, error: 'Foto upload mislukt op de server (geen ID teruggekregen).' };
        }
        return { success: true, data: fileId };
    } catch (error) {
        safeConsoleError(`[stickers.actions.ts][uploadFileAction] Error while uploading file:`, error);
        return { success: false, error: 'Foto upload mislukt op de server.' };
    }
}
