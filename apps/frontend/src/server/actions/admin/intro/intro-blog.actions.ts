'use server';

import 'server-only';
import { revalidatePath } from "next/cache";
import {
    introBlogSchema,
    type IntroBlog
} from '@salvemundi/validations/schema/intro.zod';
import { getIntroBlogsInternal } from '@/server/queries/admin-intro.queries';
import { getSystemDirectus } from "@/lib/directus";
import { updateItem, createItem } from '@directus/sdk';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { checkIntroAdminAccess, genericDelete } from './intro-signup.actions';

export async function getIntroBlogs(): Promise<IntroBlog[]> {
    await checkIntroAdminAccess();
    const data = await getIntroBlogsInternal();
    return data as unknown as IntroBlog[];
}

export async function upsertIntroBlog(blog: Partial<IntroBlog>): Promise<{ success: boolean; data?: IntroBlog; error?: string; fieldErrors?: Record<string, string[] | undefined> }> {
    await checkIntroAdminAccess();

    const sanitized = Object.fromEntries(
        Object.entries(blog).map(([k, v]) => [k, v === null ? undefined : v])
    );

    const validated = introBlogSchema.safeParse(sanitized);
    if (!validated.success) {
        const fieldErrors = validated.error.flatten().fieldErrors;
        return {
            success: false,
            error: `Validatie mislukt: ${Object.keys(fieldErrors).join(', ')}`,
            fieldErrors
        };
    }

    const { id, ...payload } = validated.data;

    try {
        let result;
        const sanitizedPayload = {
            ...payload,
            created_at: toLocalISOString(payload.created_at, true)
        };

        if (id) {
            result = await getSystemDirectus().request(updateItem('intro_blogs', id, sanitizedPayload));
        } else {
            result = await getSystemDirectus().request(createItem('intro_blogs', sanitizedPayload));
        }
        revalidatePath('/beheer/intro');

        return {
            success: true, data: {
                id: Number(result.id),
                title: result.title || '',
                content: result.content || '',
                blog_type: (result.blog_type || 'update') as IntroBlog['blog_type'],
                is_published: !!result.is_published,
                created_at: result.created_at ? toLocalISOString(result.created_at, true) ?? undefined : undefined,
                slug: result.slug || '',
                excerpt: result.excerpt || ''
            }
        };
    } catch (error) {
        console.error('[AdminIntro] Failed to upsert blog:', error);
        return { success: false, error: 'Opslaan mislukt' };
    }
}

export async function deleteIntroBlog(id: number): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    return genericDelete('intro_blogs', id);
}
