'use server';

import { z } from 'zod';

import 'server-only';
import { revalidatePath } from "next/cache";
import {
    introBlogSchema,
    type IntroBlog
} from '@salvemundi/validations/schema/intro.zod';
import { getIntroBlogsInternal } from '@/server/queries/intro/admin-intro.queries';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { checkIntroAdminAccess } from './admin-intro-signup.actions';
import { safeConsoleError } from '@/server/utils/logger';

interface DirectusBlogRow {
    id: string | number;
    title: string | null;
    content: string | null;
    blog_type: string | null;
    is_published: boolean | number | null;
    created_at: string | Date | null;
    slug: string | null;
    excerpt: string | null;
}

export async function getIntroBlogs(): Promise<IntroBlog[]> {
    await checkIntroAdminAccess();
    const data = await getIntroBlogsInternal();
    return data as unknown as IntroBlog[];
}

export async function upsertIntroBlog(blog: Partial<IntroBlog>): Promise<{ success: boolean; data?: IntroBlog; error?: string; fieldErrors?: Record<string, string[] | undefined> }> {
    await checkIntroAdminAccess();

    const sanitized = Object.fromEntries(
        Object.entries(blog).map(([key, value]) => [key, value === null ? undefined : value])
    );

    const validated = introBlogSchema.safeParse(sanitized);
    if (!validated.success) {
        const fieldErrors = z.flattenError(validated.error).fieldErrors;
        return {
            success: false,
            error: `Validatie mislukt: ${Object.keys(fieldErrors).join(', ')}`,
            fieldErrors
        };
    }

    const { id, ...payload } = validated.data;

    try {
        let result: DirectusBlogRow;
        const sanitizedPayload = {
            ...payload,
            created_at: toLocalISOString(payload.created_at, true)
        };

        if (id) {
            const updated = await db.update(schema.intro_blogs).set(sanitizedPayload).where(eq(schema.intro_blogs.id, id)).returning();
            result = updated[0] as unknown as DirectusBlogRow;
        } else {
            const inserted = await db.insert(schema.intro_blogs).values(sanitizedPayload).returning();
            result = inserted[0] as unknown as DirectusBlogRow;
        }
        revalidatePath('/beheer/intro');

        return {
            success: true,
            data: {
                id: Number(result.id),
                title: result.title || '',
                content: result.content || '',
                blog_type: (result.blog_type || 'update') as IntroBlog['blog_type'],
                is_published: !!result.is_published,
                created_at: result.created_at ? toLocalISOString(result.created_at, true) ?? null : null,
                slug: result.slug || '',
                excerpt: result.excerpt || ''
            } as IntroBlog
        };
    } catch (error: unknown) {
        safeConsoleError('[intro-blog.actions.ts][upsertIntroBlog] Failed to upsert blog:', error);
        return { success: false, error: 'Opslaan mislukt' };
    }
}

export async function deleteIntroBlog(id: number): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    try {
        await db.delete(schema.intro_blogs).where(eq(schema.intro_blogs.id, id));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch {
        return { success: false, error: 'Verwijderen mislukt' };
    }
}