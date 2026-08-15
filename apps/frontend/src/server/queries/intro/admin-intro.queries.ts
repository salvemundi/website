import 'server-only';
import { db, schema } from "@salvemundi/db";
import { desc, asc, eq } from 'drizzle-orm';
import {
    type IntroBlog,
    type IntroPlanningItem,
    type IntroConfidant,
    introBlogSchema,
    introPlanningSchema,
    introConfidantSchema
} from '@salvemundi/validations/schema/intro.zod';
import { z } from 'zod';
import { safeConsoleError } from '@/server/utils/logger';

export async function getIntroSignupsInternal() {
    try {
        return await db
            .select()
            .from(schema.intro_signups)
            .orderBy(desc(schema.intro_signups.id))
            .limit(1000);
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getIntroSignupsInternal] failed:', error);
        throw new Error('Kon aanmeldingen niet ophalen');
    }
}

export async function getIntroParentSignupsInternal() {
    try {
        return await db
            .select()
            .from(schema.intro_parent_signups)
            .orderBy(desc(schema.intro_parent_signups.id))
            .limit(1000);
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getIntroParentSignupsInternal] failed:', error);
        throw new Error('Kon ouder-aanmeldingen niet ophalen');
    }
}

export async function getIntroBlogsInternal(): Promise<IntroBlog[]> {
    try {
        const rows = await db
            .select()
            .from(schema.intro_blogs)
            .orderBy(desc(schema.intro_blogs.id))
            .limit(200);

        const mapped = rows.map(i => ({
            ...i,
            id: Number(i.id),
            title: typeof i.title === 'string' ? i.title : '',
            content: typeof i.content === 'string' ? i.content : '',
            blog_type: (typeof i.blog_type === 'string' ? i.blog_type : 'update') as IntroBlog['blog_type'],
            is_published: !!i.is_published
        }));

        const parsed = z.array(introBlogSchema).safeParse(mapped);
        if (!parsed.success) {
            safeConsoleError('[admin-intro.queries.ts][getIntroBlogsInternal] validation failed:', parsed.error);
            return mapped as IntroBlog[];
        }
        return parsed.data;
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getIntroBlogsInternal] failed:', error);
        throw new Error('Kon blogs niet ophalen');
    }
}

export async function getIntroPlanningInternal(): Promise<IntroPlanningItem[]> {
    try {
        const rows = await db
            .select()
            .from(schema.intro_planning)
            .orderBy(asc(schema.intro_planning.date), asc(schema.intro_planning.time_start))
            .limit(200);

        const toStr = (value: unknown): string => {
            if (typeof value === 'string') return value;
            if (value instanceof Date) return value.toISOString().split('T')[0];
            return '';
        };
        const toTimeStr = (value: unknown): string => {
            if (typeof value === 'string') return value;
            if (value instanceof Date) return value.toTimeString().split(' ')[0];
            return '';
        };

        const mapped = rows.map(i => ({
            ...i,
            id: Number(i.id),
            date: toStr(i.date),
            time_start: toTimeStr(i.time_start),
            title: typeof i.title === 'string' ? i.title : '',
            description: typeof i.description === 'string' ? i.description : '',
            is_mandatory: typeof i.is_mandatory === 'string' ? i.is_mandatory : ''
        }));

        const parsed = z.array(introPlanningSchema).safeParse(mapped);
        if (!parsed.success) {
            safeConsoleError('[admin-intro.queries.ts][getIntroPlanningInternal] validation failed:', parsed.error);
            return mapped as IntroPlanningItem[];
        }
        return parsed.data;
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getIntroPlanningInternal] failed:', error);
        throw new Error('Kon planning niet ophalen');
    }
}

export async function getIntroConfidantsInternal(activeOnly = false): Promise<IntroConfidant[]> {
    try {
        const rows = await db
            .select()
            .from(schema.intro_confidants)
            .where(activeOnly ? eq(schema.intro_confidants.is_active, true) : undefined)
            .orderBy(asc(schema.intro_confidants.sort_order), asc(schema.intro_confidants.id))
            .limit(100);

        const mapped = rows.map(i => ({
            ...i,
            id: Number(i.id),
            name: typeof i.name === 'string' ? i.name : '',
            email: i.email ?? null,
            phone_number: i.phone_number ?? null,
            image: i.image ?? null,
            bio: i.bio ?? null,
            sort_order: i.sort_order ?? 0,
            is_active: i.is_active ?? true
        }));

        const parsed = z.array(introConfidantSchema).safeParse(mapped);
        if (!parsed.success) {
            safeConsoleError('[admin-intro.queries.ts][getIntroConfidantsInternal] validation failed:', parsed.error);
            return mapped as IntroConfidant[];
        }
        return parsed.data;
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getIntroConfidantsInternal] failed:', error);
        throw new Error('Kon vertrouwenspersonen niet ophalen');
    }
}

export async function getIntroPlanningImageInternal(): Promise<string | null> {
    try {
        const rows = await db
            .select({ planning_image: schema.intro_settings.planning_image })
            .from(schema.intro_settings)
            .orderBy(asc(schema.intro_settings.id))
            .limit(1);

        return rows[0]?.planning_image ?? null;
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getIntroPlanningImageInternal] failed:', error);
        return null;
    }
}