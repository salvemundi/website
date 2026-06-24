import 'server-only';
import { db, schema } from "@salvemundi/db";
import { desc, asc } from 'drizzle-orm';
import {
    type IntroBlog,
    type IntroPlanningItem,
    introBlogSchema,
    introPlanningSchema
} from '@salvemundi/validations/schema/intro.zod';
import { z } from 'zod';
import { safeConsoleError } from '@/server/utils/logger';

interface IntroBlogRow {
    id: string | number;
    title?: unknown;
    content?: unknown;
    blog_type?: unknown;
    is_published?: unknown;
}

interface IntroPlanningRow {
    id: string | number;
    date?: unknown;
    time_start?: unknown;
    title?: unknown;
    description?: unknown;
}

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

        const mapped = (rows as IntroBlogRow[]).map(i => ({
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

        const toStr = (v: unknown): string => {
            if (typeof v === 'string') return v;
            if (v instanceof Date) return v.toISOString().split('T')[0];
            return '';
        };
        const toTimeStr = (v: unknown): string => {
            if (typeof v === 'string') return v;
            if (v instanceof Date) return v.toTimeString().split(' ')[0];
            return '';
        };

        const mapped = (rows as IntroPlanningRow[]).map(i => ({
            id: Number(i.id),
            date: toStr(i.date),
            time_start: toTimeStr(i.time_start),
            title: typeof i.title === 'string' ? i.title : '',
            description: typeof i.description === 'string' ? i.description : ''
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