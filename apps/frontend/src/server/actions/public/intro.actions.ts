'use server';

import {
    introSignupFormSchema,
    introParentSignupFormSchema,
    type IntroSignupForm,
    type IntroParentSignupForm,
    type IntroBlog
} from '@salvemundi/validations/schema/intro.zod';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getSystemDirectus } from '@/lib/directus';
import { readItems, createItem } from '@directus/sdk';
import { query } from '@/lib/database';
import { revalidatePath } from 'next/cache';
import { normalizeDate } from '@/lib/utils/date-utils';
import { safeConsoleError } from '@/server/utils/logger';

interface IntroFeatureFlagRow {
    is_active: boolean;
    message: string | null;
}

interface ParentSignupRecord {
    id: number;
    user_id: string | null;
    email: string | null;
}

const getMailUrl = () => process.env.MAIL_SERVICE_URL;

const getServiceHeaders = (): HeadersInit => {
    const token = (process.env.INTERNAL_SERVICE_TOKEN || '').replace(/^"|"$/g, '').trim();
    if (!token) throw new Error('INTERNAL_SERVICE_TOKEN is missing');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

export async function getIntroSettings() {
    try {
        const { rows } = await query<IntroFeatureFlagRow>('SELECT is_active, message FROM feature_flags WHERE route_match = $1 LIMIT 1', ['/intro']);

        if (rows.length === 0) {
            return {
                show: false,
                disabled_message: 'De inschrijvingen voor de introweek zijn momenteel gesloten.'
            };
        }

        const data = rows[0];

        return {
            show: data.is_active,
            disabled_message: data.message ?? 'De inschrijvingen voor de introweek zijn momenteel gesloten.'
        };
    } catch (error: unknown) {
        safeConsoleError(`[intro.actions.ts][getIntroSettings] Error while fetching intro settings:`, error);
        return { show: false, disabled_message: 'De inschrijvingen voor de introweek zijn momenteel gesloten.' };
    }
}

export async function hasParentSignup(): Promise<boolean> {
    const check = await checkParentSignupInternal();
    return check.exists;
}

async function checkParentSignupInternal(): Promise<{ exists: boolean; record?: ParentSignupRecord }> {
    const session = await getEnrichedSession();

    if (!session?.user) return { exists: false };

    try {
        const signups = await getSystemDirectus().request(
            readItems('intro_parent_signups', {
                filter: { user_id: { _eq: session.user.id } },
                fields: ['id', 'user_id', 'email'],
                limit: 1
            })
        ) as unknown as ParentSignupRecord[];

        if (signups.length > 0 && signups[0]) {
            return { exists: true, record: signups[0] };
        }

        return { exists: false };
    } catch (error: unknown) {
        safeConsoleError('[intro.actions.ts][checkParentSignupInternal] Directus check failed:', error);
        throw error;
    }
}

export async function submitIntroSignup(data: IntroSignupForm): Promise<{ success: boolean; error?: string }> {
    const normalizedGeboorte = normalizeDate(data.geboortedatum);
    data.geboortedatum = normalizedGeboorte ?? data.geboortedatum;

    const parsed = introSignupFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: 'Validatie mislukt' };
    }

    const { rateLimit } = await import('@/server/utils/ratelimit');
    const { success } = await rateLimit('intro-signup', 3, 300);
    if (!success) {
        return { success: false, error: 'Te veel aanmeldingen vanaf dit IP-adres. Probeer het later opnieuw.' };
    }

    if (parsed.data.website) {
        return { success: true };
    }

    const payload = {
        first_name: parsed.data.voornaam,
        last_name: parsed.data.achternaam,
        date_of_birth: parsed.data.geboortedatum,
        email: parsed.data.email,
        phone_number: parsed.data.telefoonnummer,
        favorite_gif: parsed.data.favorieteGif || null
    };

    try {
        await getSystemDirectus().request(createItem('intro_signups', payload));
    } catch (error: unknown) {
        safeConsoleError(`[intro.actions.ts][submitIntroSignup] Error while submitting intro signup:`, error);
        throw new Error('Er is een fout opgetreden bij je inschrijving');
    }

    fetch(`${getMailUrl()}/api/mail/send`, {
        method: 'POST',
        headers: getServiceHeaders(),
        body: JSON.stringify({
            templateId: 'intro-signup',
            to: payload.email,
            data: {
                firstName: payload.first_name,
                lastName: payload.last_name,
                phone: payload.phone_number
            }
        })
    }).catch((error: unknown) => {
        safeConsoleError(`[intro.actions.ts][submitIntroSignup] Error while triggering mail microservice:`, error);
    });
    return { success: true };
}

export async function getIntroBlogsPublic(): Promise<IntroBlog[]> {
    try {
        const sql = 'SELECT id, title, content, slug, excerpt, image, is_published, created_at, updated_at FROM intro_blogs WHERE is_published = true ORDER BY id DESC LIMIT 6';
        const { rows } = await query<IntroBlog>(sql);
        return rows;
    } catch (error: unknown) {
        safeConsoleError(`[intro.actions.ts][getIntroBlogsPublic] Error while fetching intro blogs:`, error);
        throw new Error('Er is een fout opgetreden bij het ophalen van de intro blogs');
    }
}

export async function getAllIntroBlogsPublic(): Promise<IntroBlog[]> {
    try {
        const sql = 'SELECT id, title, content, slug, excerpt, image, is_published, created_at, updated_at FROM intro_blogs WHERE is_published = true ORDER BY id DESC';
        const { rows } = await query<IntroBlog>(sql);
        return rows;
    } catch (error: unknown) {
        safeConsoleError(`[intro.actions.ts][getAllIntroBlogsPublic] Error while fetching all intro blogs:`, error);
        throw new Error('Er is een fout opgetreden bij het ophalen van de intro blogs');
    }
}

export async function getIntroBlogBySlug(slug: string): Promise<IntroBlog | null> {
    try {
        const sql = 'SELECT id, title, content, slug, excerpt, image, is_published, created_at, updated_at FROM intro_blogs WHERE slug = $1 AND is_published = true LIMIT 1';
        const { rows } = await query<IntroBlog>(sql, [slug]);
        return rows[0] ?? null;
    } catch (error: unknown) {
        safeConsoleError(`[intro.actions.ts][getIntroBlogBySlug] Error while fetching intro blog by slug:`, error);
        throw new Error('Er is een fout opgetreden bij het ophalen van de intro blog');
    }
}

export async function submitIntroParentSignup(data: IntroParentSignupForm): Promise<{ success: boolean; error?: string }> {
    const session = await getEnrichedSession();

    if (!session?.user) {
        return { success: false, error: 'Je moet ingelogd zijn als lid om je aan te melden als Intro Ouder' };
    }

    const check = await checkParentSignupInternal();
    if (check.exists && check.record) {
        return { success: true };
    }

    const { rateLimit } = await import('@/server/utils/ratelimit');
    const { success } = await rateLimit('intro-parent-signup', 3, 300);
    if (!success) {
        return { success: false, error: 'Te veel aanmeldingen. Probeer het over een paar minuten opnieuw.' };
    }

    const parsed = introParentSignupFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: 'Validatie mislukt' };
    }

    const rawName = session.user.name;
    const nameParts = rawName.split(' ');

    const payload = {
        user_id: session.user.id,
        first_name: nameParts[0] || rawName,
        last_name: nameParts.slice(1).join(' '),
        email: session.user.email,
        phone_number: parsed.data.telefoonnummer,
        motivation: parsed.data.motivation,
        availability: []
    };

    try {
        await getSystemDirectus().request(createItem('intro_parent_signups', payload));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch (error: unknown) {
        safeConsoleError('[intro.actions.ts][submitIntroParentSignup] Error details:', error);
        return { success: false, error: 'Er is een fout opgetreden bij uw aanmelding' };
    }
}