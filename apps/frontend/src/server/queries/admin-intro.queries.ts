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

/**
 * PURE QUERIES: No 'use server' and No headers() calls.
 * Safe to use in both Server Component renders and Server Actions.
 */

export async function getIntroStatsInternal() {
    try {
        const sql = `
            SELECT 
                (SELECT COUNT(*) FROM intro_signups) as signups,
                (SELECT COUNT(*) FROM intro_parent_signups) as parents,
                (SELECT COUNT(*) FROM intro_blogs) as blogs,
                (SELECT COUNT(*) FROM intro_planning) as planning
        `;
        const { rows } = await query(sql);
        const stats = rows[0];

        return {
            signups: Number(stats?.signups ?? 0),
            parents: Number(stats?.parents ?? 0),
            blogs: Number(stats?.blogs ?? 0),
            planning: Number(stats?.planning ?? 0),
        };
    } catch (e) {
        console.error('[AdminIntroQueries] getIntroStatsInternal failed:', e);
        return { signups: 0, parents: 0, blogs: 0, planning: 0 };
    }
}

export async function getIntroSignupsInternal() {
    try {
        const sql = 'SELECT * FROM intro_signups ORDER BY id DESC LIMIT 1000';
        const { rows } = await query(sql);
        
        const parsed = z.array(introSignupDbSchema).safeParse(rows);
        if (!parsed.success) {
            console.error('[AdminIntroQueries] getIntroSignupsInternal validation failed:', parsed.error);
            return rows; // Fallback to raw rows for now, but logged
        }
        return parsed.data;
    } catch (e) {
        console.error('[AdminIntroQueries] getIntroSignupsInternal failed:', e);
        throw new Error('Kon aanmeldingen niet ophalen');
    }
}

export async function getIntroParentSignupsInternal() {
    try {
        const sql = 'SELECT * FROM intro_parent_signups ORDER BY id DESC LIMIT 1000';
        const { rows } = await query(sql);

        const parsed = z.array(introParentSignupDbSchema).safeParse(rows);
        if (!parsed.success) {
            console.error('[AdminIntroQueries] getIntroParentSignupsInternal validation failed:', parsed.error);
            return rows;
        }
        return parsed.data;
    } catch (e) {
        console.error('[AdminIntroQueries] getIntroParentSignupsInternal failed:', e);
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
            
            return mapped as IntroBlog[];
        }
        return parsed.data;
    } catch (e) {
        console.error('[AdminIntroQueries] getIntroBlogsInternal failed:', e);
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
    } catch (e) {
        console.error('[AdminIntroQueries] getIntroPlanningInternal failed:', e);
        throw new Error('Kon planning niet ophalen');
    }
}
