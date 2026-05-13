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

export async function getIntroSignupsInternal() {
    try {
        const sql = 'SELECT * FROM intro_signups ORDER BY id DESC LIMIT 1000';
        const { rows } = await query(sql);

        const parsed = z.array(introSignupDbSchema).safeParse(rows);
        if (!parsed.success) {
            safeConsoleError('[AdminIntroQueries][getIntroSignupsInternal] validation failed:', parsed.error);
            return rows;
        }
        return parsed.data;
    } catch (error) {
        safeConsoleError('[AdminIntroQueries][getIntroSignupsInternal] failed:', error);
        throw new Error('Kon aanmeldingen niet ophalen');
    }
}

export async function getIntroParentSignupsInternal() {
    try {
        const sql = 'SELECT * FROM intro_parent_signups ORDER BY id DESC LIMIT 1000';
        const { rows } = await query(sql);

        const parsed = z.array(introParentSignupDbSchema).safeParse(rows);
        if (!parsed.success) {
            safeConsoleError('[AdminIntroQueries][getIntroParentSignupsInternal] validation failed:', parsed.error);
            return rows;
        }
        return parsed.data;
    } catch (error) {
        safeConsoleError('[AdminIntroQueries][getIntroParentSignupsInternal] failed:', error);
        throw new Error('Kon ouder-aanmeldingen niet ophalen');
    }
}

export async function getIntroBlogsInternal(): Promise<IntroBlog[]> {
    try {
        const sql = 'SELECT * FROM intro_blogs ORDER BY id DESC LIMIT 200';
        const { rows } = await query(sql);

        const mapped = rows.map(i => ({
            ...i,
            id: Number(i.id),
            title: i.title || '',
            content: i.content || '',
            blog_type: (i.blog_type || 'update') as IntroBlog['blog_type'],
            is_published: !!i.is_published
        }));

        const parsed = z.array(introBlogSchema).safeParse(mapped);
        if (!parsed.success) {
            safeConsoleError('[AdminIntroQueries][getIntroBlogsInternal] validation failed:', parsed.error);
            return mapped as IntroBlog[];
        }
        return parsed.data;
    } catch (error) {
        safeConsoleError('[AdminIntroQueries][getIntroBlogsInternal] failed:', error);
        throw new Error('Kon blogs niet ophalen');
    }
}

export async function getIntroPlanningInternal(): Promise<IntroPlanningItem[]> {
    try {
        const sql = 'SELECT * FROM intro_planning ORDER BY date ASC, time_start ASC LIMIT 200';
        const { rows } = await query(sql);

        const mapped = rows.map(i => ({
            ...i,
            id: Number(i.id),
            date: i.date || '',
            time_start: i.time_start || '',
            title: i.title || '',
            description: i.description || ''
        }));

        const parsed = z.array(introPlanningSchema).safeParse(mapped);
        if (!parsed.success) {

            return mapped as IntroPlanningItem[];
        }
        return parsed.data;
    } catch (error) {
        safeConsoleError('[AdminIntroQueries][getIntroPlanningInternal] failed:', error);
        throw new Error('Kon planning niet ophalen');
    }
}

