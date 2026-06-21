import 'server-only';
import { query } from '@/lib/database';
import {
    type IntroBlog,
    type IntroPlanningItem,
    introBlogSchema,
    introPlanningSchema,
    introSignupDbSchema,
    introParentSignupDbSchema
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
        const sql = 'SELECT * FROM intro_signups ORDER BY id DESC LIMIT 1000';
        const { rows } = await query(sql);

        const parsed = z.array(introSignupDbSchema).safeParse(rows);
        if (!parsed.success) {
            safeConsoleError('[admin-intro.queries.ts][getIntroSignupsInternal] validation failed:', parsed.error);
            return rows as z.infer<typeof introSignupDbSchema>[];
        }
        return parsed.data;
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getIntroSignupsInternal] failed:', error);
        throw new Error('Kon aanmeldingen niet ophalen');
    }
}

export async function getIntroParentSignupsInternal() {
    try {
        const sql = 'SELECT * FROM intro_parent_signups ORDER BY id DESC LIMIT 1000';
        const { rows } = await query(sql);

        const parsed = z.array(introParentSignupDbSchema).safeParse(rows);
        if (!parsed.success) {
            safeConsoleError('[admin-intro.queries.ts][getIntroParentSignupsInternal] validation failed:', parsed.error);
            return rows as z.infer<typeof introParentSignupDbSchema>[];
        }
        return parsed.data;
    } catch (error) {
        safeConsoleError('[admin-intro.queries.ts][getIntroParentSignupsInternal] failed:', error);
        throw new Error('Kon ouder-aanmeldingen niet ophalen');
    }
}

export async function getIntroBlogsInternal(): Promise<IntroBlog[]> {
    try {
        const sql = 'SELECT * FROM intro_blogs ORDER BY id DESC LIMIT 200';
        const { rows } = await query(sql);

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
        const sql = 'SELECT * FROM intro_planning ORDER BY date ASC, time_start ASC LIMIT 200';
        const { rows } = await query(sql);

        const toStr = (v: unknown): string => {
            if (typeof v === 'string') return v;
            if (v instanceof Date) return v.toISOString().split('T')[0];
            return '';
        };
        const toTimeStr = (v: unknown): string => {
            if (typeof v === 'string') return v;
            if (v instanceof Date) return v.toTimeString().split(' ')[0]; // "HH:MM:SS"
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